import { AppError } from '@travel-suite/utils';
import AdminLoginAttemptSchema from './login-attempt.schema.js';

const FAILURE_WINDOW_MS = 60 * 60 * 1000;
const LOCK_THRESHOLD = 5;
const BASE_LOCK_MS = 15 * 60 * 1000;
const MAX_LOCK_MS = 2 * 60 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

const GENERIC_LOGIN_FAILURE = 'Incorrect email or password';

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const lockDuration = (lockCount) => Math.min(BASE_LOCK_MS * 2 ** Math.max(0, lockCount - 1), MAX_LOCK_MS);

export function createLoginThrottle({ AdminLoginAttempt, logger } = {}) {
  if (!AdminLoginAttempt) {
    const passthrough = (_req, _res, next) => next();
    return { enabled: false, guard: passthrough, releaseOnSuccess: passthrough };
  }

  const clear = (email) => AdminLoginAttempt.deleteOne({ email });

  const activeLockedUntil = async (email) => {
    const doc = await AdminLoginAttempt.findOne({ email }).select('lockedUntil').lean();
    if (!doc?.lockedUntil) return null;
    return doc.lockedUntil.getTime() > Date.now() ? doc.lockedUntil : null;
  };

  const applyFailure = async (email) => {
    const now = new Date();

    let doc = await AdminLoginAttempt.findOneAndUpdate(
      { email },
      {
        $inc: { failures: 1 },
        $set: { lastFailureAt: now, expiresAt: new Date(now.getTime() + RETENTION_MS) },
        $setOnInsert: { windowStartedAt: now, lockCount: 0 },
      },
      { new: true, upsert: true },
    );

    const windowStale = now.getTime() - new Date(doc.windowStartedAt).getTime() > FAILURE_WINDOW_MS;
    const lockElapsed = Boolean(doc.lockedUntil) && doc.lockedUntil.getTime() <= now.getTime();

    if (windowStale || lockElapsed) {
      doc = await AdminLoginAttempt.findOneAndUpdate(
        { email },
        { $set: { failures: 1, windowStartedAt: now, lockedUntil: null } },
        { new: true },
      );
      if (!doc) return;
    }

    const alreadyLocked = Boolean(doc.lockedUntil) && doc.lockedUntil.getTime() > now.getTime();
    if (doc.failures < LOCK_THRESHOLD || alreadyLocked) return;

    const lockCount = (doc.lockCount || 0) + 1;
    const lockedUntil = new Date(now.getTime() + lockDuration(lockCount));

    await AdminLoginAttempt.updateOne(
      { email },
      { $set: { lockedUntil, lockCount, expiresAt: new Date(lockedUntil.getTime() + RETENTION_MS) } },
    );
  };

  const registerFailure = async (email) => {
    try {
      return await applyFailure(email);
    } catch (err) {
      if (err?.code === 11000) return applyFailure(email);
      throw err;
    }
  };

  const guard = async (req, res, next) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) return next();

    try {
      if (await activeLockedUntil(email)) {
        return next(new AppError(GENERIC_LOGIN_FAILURE, 401));
      }
    } catch (err) {
      logger?.error?.('Admin login throttle lookup failed', { error: err });
      return next();
    }

    res.on('finish', () => {
      const settled =
        res.statusCode === 401 ? registerFailure(email) : res.statusCode < 400 ? clear(email) : null;
      settled?.catch((err) => logger?.error?.('Admin login throttle update failed', { error: err }));
    });

    return next();
  };

  const releaseOnSuccess = (req, res, next) => {
    const email = normalizeEmail(req.body?.email);
    if (!email) return next();

    res.on('finish', () => {
      if (res.statusCode >= 400) return;
      clear(email).catch((err) => logger?.error?.('Admin login throttle release failed', { error: err }));
    });

    return next();
  };

  return { enabled: true, guard, releaseOnSuccess, registerFailure, clear, activeLockedUntil };
}

export function createLoginThrottleFromDb({ db, logger } = {}) {
  if (!db) return createLoginThrottle();

  let AdminLoginAttempt;
  try {
    AdminLoginAttempt = db.model('admin-login-attempt');
  } catch {
    AdminLoginAttempt = db.model('admin-login-attempt', AdminLoginAttemptSchema);
  }

  return createLoginThrottle({ AdminLoginAttempt, logger });
}

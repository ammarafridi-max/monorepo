import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { AppError } from '@travel-suite/utils';

const CODE_LENGTH = 6;
const TTL_MS = 10 * 60 * 1000;
const RETENTION_MS = 2 * 60 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const REQUEST_WINDOW_MS = 60 * 60 * 1000;
const MAX_REQUESTS_PER_HOUR = 5;
const MAX_REQUESTS_PER_HOUR_PER_IP = 3;
const MAX_TRACKED_SOURCES = 20000;

const GENERIC_FAILURE = 'Invalid or expired code';
const THROTTLED = 'Too many codes requested. Please try again later.';

const normalizeEmail = (v) => String(v || '').trim().toLowerCase();

function generateCode() {
  return String(crypto.randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, '0');
}

export function createOtpService({ AdminUser, AdminOtp, sendEmail, brandName, loginUrl, logger }) {
  const enabled = typeof sendEmail === 'function';

  const sourceHits = new Map();

  const liveHits = (key, now) =>
    (sourceHits.get(key) || []).filter((h) => h.at > now - REQUEST_WINDOW_MS);

  const pruneSources = (now) => {
    for (const key of sourceHits.keys()) {
      const hits = liveHits(key, now);
      if (hits.length) sourceHits.set(key, hits);
      else sourceHits.delete(key);
    }
  };

  const sourceKey = (ip, email) => (ip ? `${ip}|${email}` : null);

  const recordSourceHit = (key, purpose, now) => {
    if (!key) return;
    if (sourceHits.size >= MAX_TRACKED_SOURCES) pruneSources(now);
    sourceHits.set(key, [...liveHits(key, now), { at: now, purpose }]);
  };

  const cooldownError = (lastAt, now) => {
    const wait = Math.ceil((RESEND_COOLDOWN_MS - (now - lastAt)) / 1000);
    return new AppError(`Please wait ${wait} seconds before requesting another code.`, 429);
  };

  const guardSource = (key, purpose, now) => {
    if (!key) return;
    const hits = liveHits(key, now);
    const lastSame = hits.filter((h) => h.purpose === purpose).at(-1);
    if (lastSame && now - lastSame.at < RESEND_COOLDOWN_MS) throw cooldownError(lastSame.at, now);
    if (hits.length >= MAX_REQUESTS_PER_HOUR_PER_IP) throw new AppError(THROTTLED, 429);
  };

  const requestOtp = async ({ email, ip, purpose = 'login' }) => {
    if (!enabled) throw new AppError('One-time codes are not configured', 503);
    const normalized = normalizeEmail(email);
    const now = Date.now();
    const key = sourceKey(ip, normalized);

    guardSource(key, purpose, now);

    const user = await AdminUser.findOne({ email: normalized });

    if (!user || user.status === 'INACTIVE') {
      recordSourceHit(key, purpose, now);
      return { sent: true };
    }

    const recent = await AdminOtp.find({
      user: user._id,
      createdAt: { $gte: new Date(now - REQUEST_WINDOW_MS) },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (ip && recent.filter((r) => r.requestIp === ip).length >= MAX_REQUESTS_PER_HOUR_PER_IP) {
      throw new AppError(THROTTLED, 429);
    }

    if (recent.length >= MAX_REQUESTS_PER_HOUR) {
      throw new AppError(THROTTLED, 429);
    }

    const lastSame = recent.find((r) => r.purpose === purpose);
    if (lastSame) {
      const lastAt = new Date(lastSame.createdAt).getTime();
      if (now - lastAt < RESEND_COOLDOWN_MS) throw cooldownError(lastAt, now);
    }

    await AdminOtp.updateMany(
      { user: user._id, purpose, consumedAt: null, supersededAt: null },
      { $set: { supersededAt: new Date() } },
    );

    const code = generateCode();
    await AdminOtp.create({
      user: user._id,
      email: normalized,
      codeHash: await bcrypt.hash(code, 10),
      purpose,
      usableUntil: new Date(now + TTL_MS),
      expiresAt: new Date(now + TTL_MS + RETENTION_MS),
      requestIp: ip || null,
    });

    const minutes = Math.round(TTL_MS / 60000);
    const warning = `If you did not try to sign in${loginUrl ? ` at ${loginUrl}` : ''}, someone has your email address. Ignore this message and tell your administrator.`;

    let result;
    try {
      result = await sendEmail({
        email: user.email,
        name: user.name,
        subject: purpose === 'reset' ? `Your ${brandName} password reset code` : `Your ${brandName} sign-in code`,
        htmlContent: `<p>Hi ${user.name || 'there'},</p>
<p>Your sign-in code is:</p>
<p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p>
<p>It expires in ${minutes} minutes and can be used once.</p>
<p>${warning}</p>`,
        textContent: `Hi ${user.name || 'there'},\n\nYour sign-in code is ${code}\nIt expires in ${minutes} minutes and can be used once.\n\n${warning}`,
      });
    } catch (err) {
      result = { ok: false, error: err?.message || String(err) };
    }

    if (result && result.ok === false) {
      await AdminOtp.deleteMany({ user: user._id, purpose, consumedAt: null, supersededAt: null });
      logger?.error?.('[auth] failed to send sign-in code', { error: result.error });
      throw new AppError('Could not send the code. Please try again.', 502);
    }

    recordSourceHit(key, purpose, now);
    return { sent: true };
  };

  const verifyOtp = async ({ email, code, purpose = 'login', onVerified }) => {
    if (!enabled) throw new AppError('One-time codes are not configured', 503);
    const normalized = normalizeEmail(email);
    const submitted = String(code || '').trim();
    if (!/^\d{6}$/.test(submitted)) throw new AppError(GENERIC_FAILURE, 401);

    const user = await AdminUser.findOne({ email: normalized });
    if (!user || user.status === 'INACTIVE') throw new AppError(GENERIC_FAILURE, 401);

    const record = await AdminOtp.findOne({
      user: user._id,
      purpose,
      consumedAt: null,
      supersededAt: null,
      usableUntil: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    if (!record) throw new AppError(GENERIC_FAILURE, 401);

    if (record.attempts >= MAX_ATTEMPTS) {
      await AdminOtp.updateOne({ _id: record._id }, { $set: { supersededAt: new Date() } });
      throw new AppError(GENERIC_FAILURE, 401);
    }

    if (!(await bcrypt.compare(submitted, record.codeHash))) {
      const updated = await AdminOtp.findOneAndUpdate(
        { _id: record._id },
        { $inc: { attempts: 1 } },
        { new: true },
      );
      if (updated && updated.attempts >= MAX_ATTEMPTS) {
        await AdminOtp.updateOne({ _id: record._id }, { $set: { supersededAt: new Date() } });
      }
      throw new AppError(GENERIC_FAILURE, 401);
    }

    const claimedAt = new Date();
    const consumed = await AdminOtp.findOneAndUpdate(
      { _id: record._id, consumedAt: null, supersededAt: null },
      { $set: { consumedAt: claimedAt } },
      { new: true },
    );
    if (!consumed) throw new AppError(GENERIC_FAILURE, 401);

    let outcome;
    if (typeof onVerified === 'function') {
      try {
        outcome = await onVerified(user);
      } catch (err) {
        await AdminOtp.updateOne(
          { _id: record._id, consumedAt: claimedAt },
          { $set: { consumedAt: null } },
        );
        throw err;
      }
    }

    await AdminOtp.updateMany(
      { user: user._id, purpose, consumedAt: null, supersededAt: null },
      { $set: { supersededAt: new Date() } },
    );

    return outcome ?? user;
  };

  return { requestOtp, verifyOtp, enabled };
}

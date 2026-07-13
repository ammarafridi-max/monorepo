import bcrypt from 'bcryptjs';
import { AppError } from './errors.js';

// Same cost factor the customer User uses (apps/web/lib/auth.js) and the reference
// admin-user schema uses. Keep them equal so admin and customer hashes are peers.
const BCRYPT_COST = 12;

/** Hash a plaintext password. Used by the service and the seed-admin script. */
export function hashPassword(plaintext) {
  return bcrypt.hash(String(plaintext), BCRYPT_COST);
}

/** Constant-time compare of a candidate against a stored bcrypt hash. */
export function verifyPassword(candidate, hash) {
  return bcrypt.compare(String(candidate), String(hash || ''));
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

/**
 * Create the auth service bound to the AdminUser model. All business rules live
 * here; controllers stay thin. Throws AppError for every operational failure.
 *
 * @param {{ AdminUser: import('mongoose').Model }} deps
 */
export function createAuthService({ AdminUser }) {
  const login = async ({ email, password }) => {
    if (!email || !password) throw new AppError('Email and password are required', 400);

    // passwordHash is select:false, so pull it explicitly for the compare.
    const user = await AdminUser.findOne({ email: normalizeEmail(email) }).select('+passwordHash');
    // Same generic message whether the email is unknown or the password is wrong,
    // so we never reveal which admins exist.
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new AppError('Incorrect email or password', 401);
    }
    if (user.status === 'INACTIVE') throw new AppError('This admin account is inactive', 403);

    return user;
  };

  const updatePassword = async ({ userId, passwordCurrent, passwordNew }) => {
    if (!passwordCurrent || !passwordNew) {
      throw new AppError('Current password and new password are required', 400);
    }

    const user = await AdminUser.findById(userId).select('+passwordHash');
    if (!user) throw new AppError('Admin user not found', 404);

    if (!(await verifyPassword(passwordCurrent, user.passwordHash))) {
      throw new AppError('Current password entered is wrong', 401);
    }

    user.passwordHash = await hashPassword(passwordNew);
    // Stamp 1s in the past so a token minted at this same second (the fresh one we
    // return) is NOT immediately invalidated by the passwordChangedAt > iat check.
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();
    return user;
  };

  const getCurrentUser = async (userId) => {
    const user = await AdminUser.findById(userId);
    if (!user) throw new AppError('Your data was not found. Please try again later.', 404);
    return user;
  };

  const updateCurrentUser = async (userId, payload) => {
    if (payload.password || payload.passwordHash) {
      throw new AppError('Please use /auth/update-password to change your password', 403);
    }

    const allowed = ['name', 'email'];
    const filtered = {};
    for (const key of allowed) {
      if (payload[key] !== undefined) filtered[key] = payload[key];
    }
    if (filtered.email) filtered.email = normalizeEmail(filtered.email);
    if (!Object.keys(filtered).length) throw new AppError('No valid profile fields provided', 400);

    const existing = await AdminUser.findById(userId);
    if (!existing) throw new AppError('Could not find admin user', 404);

    if (
      filtered.email &&
      filtered.email !== existing.email &&
      (await AdminUser.exists({ email: filtered.email, _id: { $ne: userId } }))
    ) {
      throw new AppError('Email is already in use by another admin user', 400);
    }

    return AdminUser.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  };

  return { login, updatePassword, getCurrentUser, updateCurrentUser };
}

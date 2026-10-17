import 'server-only';
import bcrypt from 'bcryptjs';
import { Order, User } from '@travel-suite/picturesk-shared';


export const PASSWORD_MIN = 8;

export function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function backlinkOrders(userId, email) {
  await Order.updateMany(
    { customerEmail: normalizeEmail(email), userId: null },
    { $set: { userId } }
  );
}

export async function findOrCreateOAuthUser({ email, provider }) {
  const normalized = normalizeEmail(email);
  let user = await User.findOne({ email: normalized });
  if (!user) {
    return User.create({ email: normalized, providers: [provider], emailVerifiedAt: new Date() });
  }
  let changed = false;
  if (provider && !(user.providers || []).includes(provider)) {
    user.providers = [...(user.providers || []), provider];
    changed = true;
  }
  if (!user.emailVerifiedAt) {
    user.emailVerifiedAt = new Date();
    changed = true;
  }
  if (changed) await user.save();
  return user;
}

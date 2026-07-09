import 'server-only';
import bcrypt from 'bcryptjs';
import { Order } from '@headliner/shared';

/**
 * Credentials helpers: password hashing and the anonymous-order back-link. Kept
 * server-only; the User lookups themselves live in the route handlers.
 */

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

/**
 * Back-link a user's PAST anonymous orders. Safe by construction: it only claims
 * orders that share this exact email AND have no owner yet ({ userId: null } in
 * Mongo also matches the field being absent). It never reassigns an order that
 * already belongs to someone.
 */
export async function backlinkOrders(userId, email) {
  await Order.updateMany(
    { customerEmail: normalizeEmail(email), userId: null },
    { $set: { userId } }
  );
}

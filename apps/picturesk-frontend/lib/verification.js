import 'server-only';
import { createHmac, randomInt } from 'node:crypto';
import { User } from '@travel-suite/picturesk-shared';
import { sendVerificationCode } from './email';

const CODE_TTL_MS = 15 * 60 * 1000;
// A resend is allowed once the previous code is at least this old.
const RESEND_AFTER_MS = 60 * 1000;

function hashCode(code) {
  return createHmac('sha256', process.env.AUTH_SECRET || '').update(String(code)).digest('hex');
}

/** Does this account still need to verify its email before entering a funnel? */
export function needsVerification(user) {
  return Boolean(user?.passwordHash) && !user.emailVerifiedAt;
}

/**
 * Issue a fresh six-digit code, store its hash and expiry, and email it. Returns
 * false without sending when the last code is too young, so the resend button
 * cannot be used to flood an inbox.
 */
export async function issueVerificationCode(user) {
  const sentAt = user.verificationExpiresAt ? new Date(user.verificationExpiresAt).getTime() - CODE_TTL_MS : 0;
  if (Date.now() - sentAt < RESEND_AFTER_MS) return false;
  const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
  await User.updateOne(
    { _id: user._id },
    { $set: { verificationCodeHash: hashCode(code), verificationExpiresAt: new Date(Date.now() + CODE_TTL_MS) } }
  );
  await sendVerificationCode({ to: user.email, code });
  return true;
}

/** Check a submitted code; on success mark the email verified and clear the code. */
export async function confirmVerificationCode(user, code) {
  const submitted = String(code || '').replace(/\D/g, '');
  if (submitted.length !== 6) return false;
  if (!user.verificationCodeHash || !user.verificationExpiresAt) return false;
  if (new Date(user.verificationExpiresAt).getTime() < Date.now()) return false;
  if (hashCode(submitted) !== user.verificationCodeHash) return false;
  await User.updateOne(
    { _id: user._id },
    { $set: { emailVerifiedAt: new Date(), verificationCodeHash: null, verificationExpiresAt: null } }
  );
  return true;
}

import 'server-only';
import { createHmac, randomInt } from 'node:crypto';
import { User } from '@travel-suite/picturesk-shared';
import { sendVerificationCode } from './email';

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;

function hashCode(code) {
  return createHmac('sha256', process.env.AUTH_SECRET || '').update(String(code)).digest('hex');
}

export function needsVerification(user) {
  return Boolean(user?.passwordHash) && !user.emailVerifiedAt;
}

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

import 'server-only';
import { createEmailClient } from '@travel-suite/picturesk-shared';

let client;
function emailClient() {
  if (client !== undefined) return client;
  client = process.env.BREVO_API_KEY
    ? createEmailClient({ apiKey: process.env.BREVO_API_KEY, sender: process.env.BREVO_SENDER })
    : null;
  return client;
}

export async function sendVerificationCode({ to, code }) {
  const c = emailClient();
  if (!c) {
    if (process.env.NODE_ENV === 'production') throw new Error('[web] BREVO_API_KEY is required to send verification codes');
    console.log(`[web] verification code for ${to}: ${code}`);
    return;
  }
  await c.sendVerificationEmail({ to, code });
}

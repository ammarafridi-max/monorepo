import { createBrevoMailer } from '@travel-suite/brevo';
import { logger } from '@travel-suite/utils';
import config from './config.js';

export const { sendEmail } = createBrevoMailer({
  apiKey: config.brevoApiKey,
  sender: { name: 'Travl', email: config.adminEmail },
  logger,
});

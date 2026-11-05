import { createBrevoMailer } from '@travel-suite/brevo';
import { logger } from '@travel-suite/utils';

export function createBrandMailer({
  config,
  senderName = config.brand.name,
  senderEmail = config.adminEmail,
}) {
  return createBrevoMailer({
    apiKey: config.brevoApiKey,
    sender: { name: senderName, email: senderEmail },
    logger,
  });
}

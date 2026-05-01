import SupportEmailSchema from './schema.js';
import { createGmailClient } from './gmail.js';
import { createDrafter } from './drafter.js';
import { createEmailSupportService } from './service.js';
import { createEmailSupportController } from './controller.js';
import { createEmailSupportRouter } from './router.js';

function getOrRegisterModel(conn, name, schema) {
  try {
    return conn.model(name);
  } catch {
    return conn.model(name, schema);
  }
}

export function createEmailSupportFeature({
  db,
  auth,
  anthropicApiKey,
  brandContext,
  gmailConfig,
  logger,
}) {
  const EmailSupport = getOrRegisterModel(db, 'support-email', SupportEmailSchema);

  let gmail = null;
  if (
    gmailConfig?.clientId &&
    gmailConfig?.clientSecret &&
    gmailConfig?.refreshToken &&
    gmailConfig?.user
  ) {
    gmail = createGmailClient(gmailConfig);
  } else {
    logger.warn('[email-support] Gmail credentials not configured — polling disabled');
  }

  const drafter = createDrafter({ anthropicApiKey, brandContext });
  const service = createEmailSupportService({ EmailSupport, gmail, drafter, logger });
  const controller = createEmailSupportController({ service });
  const router = createEmailSupportRouter({ controller, auth });

  return {
    router,
    pollAndProcess: () => service.pollAndProcess(),
  };
}

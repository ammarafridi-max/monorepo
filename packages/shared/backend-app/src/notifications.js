import { createNotificationsService } from '@travel-suite/notifications';
import { logger } from '@travel-suite/utils';

export function createBrandNotifications({ config, sendEmail, website, theme, extras = {} }) {
  const { brand } = config;

  return createNotificationsService({
    sendEmail,
    logger,
    brand: {
      name: brand.name,
      teamName: `${brand.name} Team`,
      adminEmail: config.adminEmail,
      website: website ?? `https://${brand.domain}`,
      paymentsSenderName: `${brand.name} Payments`,
      deliverySenderName: `${brand.name} Delivery`,
      customerSenderName: brand.name,
      ...extras,
      theme: theme ?? {
        primaryColor: brand.theme.primaryColor,
        accentColor: brand.theme.accentColor,
        linkColor: brand.theme.primaryColor,
      },
    },
  });
}

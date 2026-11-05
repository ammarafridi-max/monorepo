import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createApp } from '@travel-suite/backend-app/app';
import config from './utils/config.js';
import indexRouter, { stripeWebhookHandler, whatsappWebhookHandlers } from './routes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const webhooks = [{ path: '/api/webhook', handler: stripeWebhookHandler }];

if (whatsappWebhookHandlers) {
  webhooks.push(
    { method: 'get', path: '/api/whatsapp/webhook', raw: false, handler: whatsappWebhookHandlers.verify },
    { path: '/api/whatsapp/webhook', handler: whatsappWebhookHandlers.receive },
  );
}

const app = createApp({
  brandKey: 'dt365',
  config,
  router: indexRouter,
  webhooks,
  staticMounts: [{ path: '/airlines', dir: join(__dirname, 'public/airlines') }],
  // The production build fetches every post and price book in one burst from a
  // single IP, which trips the limiter and fails the deploy.
  rateLimitOverrides: {
    skip: (req) =>
      Boolean(config.internalApiToken) &&
      req.get('x-internal-token') === config.internalApiToken,
  },
});

export default app;

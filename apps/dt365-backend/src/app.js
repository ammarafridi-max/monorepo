import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { logger, AppError, createErrorHandler } from '@travel-suite/utils';
import { setupSentryErrorHandler } from '@travel-suite/utils/sentry';
import config from './utils/config.js';
import indexRouter, { stripeWebhookHandler, whatsappWebhookHandlers } from './routes/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

app.set('trust proxy', 1);

app.use((req, res, next) => {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP', { method: req.method, url: req.originalUrl, status: res.statusCode, ms: Date.now() - start, requestId: req.id });
  });
  next();
});

// -- Stripe webhook (raw body required — must be before express.json) ----------
app.post('/api/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// -- WhatsApp webhook (raw body required for signature check — before express.json) --
if (whatsappWebhookHandlers) {
  app.get('/api/whatsapp/webhook', whatsappWebhookHandlers.verify);
  app.post('/api/whatsapp/webhook', express.raw({ type: 'application/json' }), whatsappWebhookHandlers.receive);
}

app.use(helmet());
app.use(cors({ origin: config.corsOrigins, credentials: true }));
app.use(compression());
app.use(cookieParser());
app.use(express.json({ limit: '10kb' }));

// The production build fetches every post and price book in one burst from a
// single IP, which trips the limiter and fails the deploy.
app.use(
  '/api',
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) =>
      Boolean(config.internalApiToken) &&
      req.get('x-internal-token') === config.internalApiToken,
  }),
);

app.use('/airlines', express.static(join(__dirname, 'public/airlines'), {
  setHeaders: (res) => res.set('Cross-Origin-Resource-Policy', 'cross-origin'),
}));

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok', brand: 'dt365' }));
app.use('/api', indexRouter);

app.all('/{*path}', (req, _res, next) => next(new AppError(`Route ${req.originalUrl} not found`, 404)));

setupSentryErrorHandler(app);
app.use(createErrorHandler({ logger, nodeEnv: config.nodeEnv }));

export default app;

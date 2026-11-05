import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { logger, AppError, createErrorHandler } from '@travel-suite/utils';
import { setupSentryErrorHandler } from '@travel-suite/utils/sentry';
import { redactUrl } from '@travel-suite/utils/redact-url';
import { sessionAwareRateLimitKey } from '@travel-suite/utils/rate-limit-key';

const crossOriginStatic = (res) =>
  res.set('Cross-Origin-Resource-Policy', 'cross-origin');

function requestContext(req, res, next) {
  req.id = req.headers['x-request-id'] || randomUUID();
  res.setHeader('x-request-id', req.id);
  const start = Date.now();
  res.on('finish', () => {
    logger.info('HTTP', {
      method: req.method,
      url: redactUrl(req.originalUrl),
      status: res.statusCode,
      ms: Date.now() - start,
      requestId: req.id,
    });
  });
  next();
}

export function createApp({
  brandKey,
  config,
  router,
  webhooks = [],
  jsonLimit = '2mb',
  urlencodedLimit,
  staticMounts = [],
  rateLimitOverrides = {},
}) {
  const app = express();

  app.set('trust proxy', 1);

  app.use(requestContext);

  // Raw-body webhooks must stay above express.json: signature checks need the unparsed body.
  for (const { method = 'post', path, raw = true, handler } of webhooks) {
    if (!handler) continue;
    const chain = raw ? [express.raw({ type: 'application/json' }), handler] : [handler];
    app[method](path, ...chain);
  }

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: jsonLimit }));
  if (urlencodedLimit) {
    app.use(express.urlencoded({ extended: true, limit: urlencodedLimit }));
  }

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 60 * 1000,
      max: 500,
      keyGenerator: sessionAwareRateLimitKey(ipKeyGenerator),
      standardHeaders: true,
      legacyHeaders: false,
      ...rateLimitOverrides,
    }),
  );

  for (const { path, dir, setHeaders = crossOriginStatic } of staticMounts) {
    app.use(path, express.static(dir, { setHeaders }));
  }

  app.get('/health', (_req, res) =>
    res.status(200).json({ status: 'ok', brand: brandKey }),
  );
  app.use('/api', router);

  app.all('/{*path}', (req, _res, next) =>
    next(new AppError(`Route ${redactUrl(req.originalUrl)} not found`, 404)),
  );

  setupSentryErrorHandler(app);
  app.use(createErrorHandler({ logger, nodeEnv: config.nodeEnv }));

  return app;
}

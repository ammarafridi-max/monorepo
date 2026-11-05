import { requireEnv } from '@travel-suite/utils';

export function validateBackendEnv(config, { name, extraRequired = {}, extraProductionRequired = {} }) {
  const isProduction = config.nodeEnv === 'production';

  const required = {
    mongoUri: 'MONGO_URI',
    jwtSecret: 'JWT_SECRET',
    ...extraRequired,
  };

  if (isProduction) {
    Object.assign(required, {
      'stripe.secretKey': 'STRIPE_SECRET_KEY',
      'stripe.webhookSecret': 'STRIPE_WEBHOOK_SECRET',
      ...extraProductionRequired,
    });
  }

  try {
    requireEnv(config, required);
  } catch (err) {
    console.error(`[${name}] startup aborted: ${err.message}`);
    process.exit(1);
  }

  if (isProduction && !config.brevoApiKey) {
    console.warn(`[${name}] BREVO_API_KEY unset: transactional email disabled`);
  }
}

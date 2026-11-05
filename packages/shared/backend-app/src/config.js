import { getBrand } from '@travel-suite/config';

export const parseList = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const parseRate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 1;
};

export const parseBool = (value) =>
  ['1', 'true', 'yes'].includes(String(value ?? '').toLowerCase());

export function createBackendConfig({
  brandKey,
  port: defaultPort,
  frontendUrl: defaultFrontendUrl = 'http://localhost:3000',
  corsOrigins: defaultCorsOrigins = ['http://localhost:3000'],
  overrides = {},
}) {
  const brand = getBrand(brandKey);
  const port = parseNumber(process.env.PORT, defaultPort);

  const base = {
    brand,
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port,
    mongoUri: process.env.MONGO_URI,

    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '30d',
    jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 30),

    anthropicApiKey: process.env.ANTHROPIC_API_KEY,

    brevoApiKey: process.env.BREVO_API_KEY,
    adminEmail: process.env.ADMIN_EMAIL ?? brand.emails.from,

    corsOrigins: parseList(
      process.env.CORS_ORIGINS,
      typeof defaultCorsOrigins === 'function' ? defaultCorsOrigins(brand) : defaultCorsOrigins,
    ),
    frontendUrl: process.env.FRONTEND_URL ?? defaultFrontendUrl,

    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET,
    },

    stripe: {
      secretKey: process.env.STRIPE_SECRET_KEY,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  };

  return {
    ...base,
    ...(typeof overrides === 'function' ? overrides(base) : overrides),
  };
}

export const googleAdsConfig = (actions = {}) => ({
  customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
  loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
  developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
  clientId: process.env.GOOGLE_ADS_CLIENT_ID,
  clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
  refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
  apiVersion: process.env.GOOGLE_ADS_API_VERSION ?? 'v26',
  timezoneOffset: process.env.GOOGLE_ADS_TIMEZONE_OFFSET ?? '+04:00',
  ...Object.fromEntries(
    Object.entries(actions).map(([name, suffix]) => [
      name,
      {
        conversionAction: process.env[`GOOGLE_ADS_CONVERSION_ACTION_${suffix}`],
        valueRate: parseRate(process.env[`GOOGLE_ADS_VALUE_RATE_${suffix}`]),
      },
    ]),
  ),
});

export const metaConfig = () => ({
  pixelId: process.env.META_PIXEL_ID,
  capiAccessToken: process.env.META_CAPI_ACCESS_TOKEN,
  testEventCode: process.env.META_TEST_EVENT_CODE,
});

export const openaiConfig = (extra = {}) => ({
  pixelId: process.env.OPENAI_PIXEL_ID,
  capiApiKey: process.env.OPENAI_CAPI_API_KEY,
  adsApiKey: process.env.OPENAI_ADS_API_KEY,
  adsMaxDailyBudget: parseNumber(process.env.OPENAI_ADS_MAX_DAILY_BUDGET, 200),
  ...extra,
});

export const wisConfig = () => ({
  url: process.env.WIS_URL,
  agencyId: process.env.WIS_AGENCY_ID,
  agencyCode: process.env.WIS_AGENCY_CODE,
});

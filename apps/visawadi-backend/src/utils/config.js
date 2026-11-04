const parseList = (value, fallback = []) => {
  if (!value || typeof value !== "string") return fallback;
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseRate = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 1 ? parsed : 1;
};

export default {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 4000),
  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 30),

  brevoApiKey: process.env.BREVO_API_KEY,

  adminEmail: process.env.ADMIN_EMAIL ?? "info@visawadi.com",

  corsOrigins: parseList(process.env.CORS_ORIGINS, [
    "http://localhost:3000",
    "https://visawadi.com",
    "https://www.visawadi.com",
  ]),

  siteUrl: process.env.SITE_URL ?? "https://www.visawadi.com",

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${parseNumber(process.env.PORT, 4000)}`,

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  openai: {
    pixelId: process.env.OPENAI_PIXEL_ID,
    capiApiKey: process.env.OPENAI_CAPI_API_KEY,
    whatsappCapiApiKey: process.env.OPENAI_WHATSAPP_CAPI_API_KEY,
    adsApiKey: process.env.OPENAI_ADS_API_KEY,
    adsMaxDailyBudget: parseNumber(process.env.OPENAI_ADS_MAX_DAILY_BUDGET, 200),
  },

  meta: {
    pixelId: process.env.META_PIXEL_ID,
    capiAccessToken: process.env.META_CAPI_ACCESS_TOKEN,
    testEventCode: process.env.META_TEST_EVENT_CODE,
  },

  googleAds: {
    customerId: process.env.GOOGLE_ADS_CUSTOMER_ID,
    loginCustomerId: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID,
    developerToken: process.env.GOOGLE_ADS_DEVELOPER_TOKEN,
    clientId: process.env.GOOGLE_ADS_CLIENT_ID,
    clientSecret: process.env.GOOGLE_ADS_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_ADS_REFRESH_TOKEN,
    apiVersion: process.env.GOOGLE_ADS_API_VERSION ?? "v26",
    timezoneOffset: process.env.GOOGLE_ADS_TIMEZONE_OFFSET ?? "+04:00",
    lead: {
      conversionAction: process.env.GOOGLE_ADS_CONVERSION_ACTION_LEAD,
      valueRate: parseRate(process.env.GOOGLE_ADS_VALUE_RATE_LEAD),
    },
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  userJwtSecret: process.env.USER_JWT_SECRET ?? process.env.JWT_SECRET,
  userJwtExpiresIn: process.env.USER_JWT_EXPIRES_IN ?? "30d",
  userCookieExpiresInDays: parseNumber(process.env.USER_COOKIE_EXPIRES_IN, 30),

  enableReminderCron: ['1', 'true', 'yes'].includes(String(process.env.ENABLE_REMINDER_CRON ?? '').toLowerCase()),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
};

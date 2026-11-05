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
  port: parseNumber(process.env.PORT, 4003),
  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "30d",
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 30),

  brevoApiKey: process.env.BREVO_API_KEY,
  brevoTicketListId: process.env.BREVO_TICKET_LIST_ID,
  adminEmail: process.env.ADMIN_EMAIL ?? "info@dummyticket365.com",

  corsOrigins: parseList(process.env.CORS_ORIGINS, ["http://localhost:3000"]),

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  internalApiToken: process.env.INTERNAL_API_TOKEN ?? "",
  audienceExportEmail: process.env.AUDIENCE_EXPORT_EMAIL ?? "",

  airlabs: {
    apiKey: process.env.AIRLABS_API_KEY,
  },
  serpapi: {
    apiKey: process.env.SERPAPI_API_KEY,
  },

  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    appSecret: process.env.WHATSAPP_APP_SECRET,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    wabaId: process.env.WHATSAPP_WABA_ID,
    webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  openai: {
    pixelId: process.env.OPENAI_PIXEL_ID,
    capiApiKey: process.env.OPENAI_CAPI_API_KEY,
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
    tickets: {
      conversionAction: process.env.GOOGLE_ADS_CONVERSION_ACTION_TICKETS,
      valueRate: parseRate(process.env.GOOGLE_ADS_VALUE_RATE_TICKETS),
    },
  },

  paypal: {
    clientId: process.env.PAYPAL_CLIENT_ID,
    clientSecret: process.env.PAYPAL_CLIENT_SECRET,
    mode: process.env.PAYPAL_MODE ?? 'sandbox',
  },


};

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

export default {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, 4000),
  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 7),

  brevoApiKey: process.env.BREVO_API_KEY,
  adminEmail: process.env.ADMIN_EMAIL ?? "info@visawadi.ae",

  corsOrigins: parseList(process.env.CORS_ORIGINS, [
    "http://localhost:3000",
    "https://visawadi.ae",
    "https://www.visawadi.ae",
  ]),

  // Public site URL, used in outbound email templates.
  siteUrl: process.env.SITE_URL ?? "https://www.visawadi.ae",

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
  // Public base URL of THIS backend — used to build magic-link sign-in URLs that
  // the browser hits directly (e.g. https://api.visawadi.ae). Falls back to the local port.
  backendUrl: process.env.BACKEND_URL ?? `http://localhost:${parseNumber(process.env.PORT, 4000)}`,

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  userJwtSecret: process.env.USER_JWT_SECRET ?? process.env.JWT_SECRET,
  userJwtExpiresIn: process.env.USER_JWT_EXPIRES_IN ?? "30d",
  userCookieExpiresInDays: parseNumber(process.env.USER_COOKIE_EXPIRES_IN, 30),

  // Daily visa-application reminder sweep (node-cron, 09:00 Asia/Dubai). Off unless
  // explicitly enabled so it never double-runs across multiple machines/regions.
  enableReminderCron: ['1', 'true', 'yes'].includes(String(process.env.ENABLE_REMINDER_CRON ?? '').toLowerCase()),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN,
    user: process.env.GMAIL_USER,
  },
};

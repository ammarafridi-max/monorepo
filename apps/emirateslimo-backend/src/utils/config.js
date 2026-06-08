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
  port: parseNumber(process.env.PORT, 3001),
  mongoUri: process.env.MONGO_URI,

  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "14d",
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 14),

  brevoApiKey: process.env.BREVO_API_KEY,
  // Recipient + sender identity for transactional emails.
  contactEmail: process.env.CONTACT_EMAIL ?? "contact@emirateslimo.com",

  corsOrigins: parseList(process.env.CORS_ORIGINS, ["http://localhost:5173"]),

  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  adminUrl: process.env.ADMIN_URL ?? "http://localhost:5173",

  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  ipInfo: {
    apiKey: process.env.IPINFO_API_KEY,
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

  // Used by the standalone blog-generation script (relocated in Phase 3).
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
};

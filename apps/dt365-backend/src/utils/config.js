const parseList = (value, fallback = []) => {
  if (!value || typeof value !== 'string') return fallback;
  return value.split(',').map((s) => s.trim()).filter(Boolean);
};

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export default {
  nodeEnv:    process.env.NODE_ENV ?? 'development',
  port:       parseNumber(process.env.PORT, 4003),
  mongoUri:   process.env.MONGO_URI,

  jwtSecret:              process.env.JWT_SECRET,
  jwtExpiresIn:           process.env.JWT_EXPIRES_IN         ?? '7d',
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 7),

  brevoApiKey: process.env.BREVO_API_KEY,
  adminEmail:  process.env.ADMIN_EMAIL ?? 'info@dummyticket365.com',

  corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  amadeus: {
    apiKey:    process.env.AMADEUS_API_KEY,
    apiSecret: process.env.AMADEUS_SECRET_KEY,
  },

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  stripe: {
    secretKey:     process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },

  userJwtSecret:           process.env.USER_JWT_SECRET          ?? process.env.JWT_SECRET,
  userJwtExpiresIn:        process.env.USER_JWT_EXPIRES_IN       ?? '30d',
  userCookieExpiresInDays: parseNumber(process.env.USER_COOKIE_EXPIRES_IN, 30),
};

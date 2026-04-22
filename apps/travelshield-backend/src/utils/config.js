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
  port:       parseNumber(process.env.PORT, 4001),
  mongoUri:   process.env.MONGO_URI,

  jwtSecret:              process.env.JWT_SECRET,
  jwtExpiresIn:           process.env.JWT_EXPIRES_IN         ?? '7d',
  jwtCookieExpiresInDays: parseNumber(process.env.JWT_COOKIE_EXPIRES_IN, 7),

  brevoApiKey: process.env.BREVO_API_KEY,
  adminEmail:  process.env.ADMIN_EMAIL ?? 'info@travelshield.ae',

  corsOrigins: parseList(process.env.CORS_ORIGINS, ['http://localhost:3000']),

  wis: {
    url:        process.env.WIS_URL,
    agencyId:   process.env.WIS_AGENCY_ID,
    agencyCode: process.env.WIS_AGENCY_CODE,
  },

  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',

  userJwtSecret:           process.env.USER_JWT_SECRET          ?? process.env.JWT_SECRET,
  userJwtExpiresIn:        process.env.USER_JWT_EXPIRES_IN       ?? '30d',
  userCookieExpiresInDays: parseNumber(process.env.USER_COOKIE_EXPIRES_IN, 30),

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey:    process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

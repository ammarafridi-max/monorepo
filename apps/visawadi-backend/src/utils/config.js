import {
  createBackendConfig,
  googleAdsConfig,
  metaConfig,
  openaiConfig,
  parseBool,
  parseNumber,
} from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "visawadi",
  port: 4000,
  corsOrigins: ({ domain }) => [
    "http://localhost:3000",
    `https://${domain}`,
    `https://www.${domain}`,
  ],
  overrides: ({ brand, port }) => ({
    siteUrl: process.env.SITE_URL ?? `https://www.${brand.domain}`,

    backendUrl: process.env.BACKEND_URL ?? `http://localhost:${port}`,

    openai: openaiConfig({
      whatsappCapiApiKey: process.env.OPENAI_WHATSAPP_CAPI_API_KEY,
    }),
    meta: metaConfig(),
    googleAds: googleAdsConfig({ lead: "LEAD" }),

    userJwtSecret: process.env.USER_JWT_SECRET ?? process.env.JWT_SECRET,
    userJwtExpiresIn: process.env.USER_JWT_EXPIRES_IN ?? "30d",
    userCookieExpiresInDays: parseNumber(process.env.USER_COOKIE_EXPIRES_IN, 30),

    enableReminderCron: parseBool(process.env.ENABLE_REMINDER_CRON),
  }),
});

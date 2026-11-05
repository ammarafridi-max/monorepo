import {
  createBackendConfig,
  googleAdsConfig,
  metaConfig,
  parseBool,
  wisConfig,
} from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "travl",
  port: 4000,
  corsOrigins: ({ domain }) => [
    "http://localhost:3000",
    `https://${domain}`,
    `https://www.${domain}`,
  ],
  overrides: ({ port }) => ({
    brevoTicketListId: process.env.BREVO_TICKET_LIST_ID,

    wis: wisConfig(),

    backendUrl: process.env.BACKEND_URL ?? `http://localhost:${port}`,

    airlabs: {
      apiKey: process.env.AIRLABS_API_KEY,
    },
    serpapi: {
      apiKey: process.env.SERPAPI_API_KEY,
    },

    meta: metaConfig(),
    googleAds: googleAdsConfig({ insurance: "INSURANCE", tickets: "TICKETS" }),

    enableReminderCron: parseBool(process.env.ENABLE_REMINDER_CRON),
  }),
});

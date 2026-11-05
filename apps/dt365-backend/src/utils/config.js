import {
  createBackendConfig,
  googleAdsConfig,
  metaConfig,
  openaiConfig,
} from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "dt365",
  port: 4003,
  overrides: {
    brevoTicketListId: process.env.BREVO_TICKET_LIST_ID,

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

    openai: openaiConfig(),
    meta: metaConfig(),
    googleAds: googleAdsConfig({ tickets: "TICKETS" }),

    paypal: {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE ?? "sandbox",
    },
  },
});

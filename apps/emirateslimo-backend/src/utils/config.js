import {
  createBackendConfig,
  googleAdsConfig,
  metaConfig,
} from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "emirateslimo",
  port: 3001,
  frontendUrl: "http://localhost:5173",
  corsOrigins: ["http://localhost:5173"],
  overrides: ({ brand }) => ({
    contactEmail: process.env.CONTACT_EMAIL ?? brand.emails.from,

    adminUrl: process.env.ADMIN_URL ?? "http://localhost:5173",

    googleMaps: {
      apiKey: process.env.GOOGLE_MAPS_API_KEY,
    },

    ipInfo: {
      apiKey: process.env.IPINFO_API_KEY,
    },

    meta: metaConfig(),
    googleAds: googleAdsConfig({ booking: "BOOKING" }),

    openaiApiKey: process.env.OPENAI_API_KEY,
  }),
});

import {
  createBackendConfig,
  metaConfig,
  openaiConfig,
  wisConfig,
} from "@travel-suite/backend-app/config";

export default createBackendConfig({
  brandKey: "thedt",
  port: 4002,
  overrides: {
    brevoTicketListId: process.env.BREVO_TICKET_LIST_ID,

    wis: wisConfig(),

    airlabs: {
      apiKey: process.env.AIRLABS_API_KEY,
    },
    serpapi: {
      apiKey: process.env.SERPAPI_API_KEY,
    },

    openai: openaiConfig(),
    meta: metaConfig(),
  },
});

import { createApp } from "@travel-suite/backend-app/app";
import config from "./utils/config.js";
import indexRouter, { stripeWebhookHandler } from "./routes/index.js";

const app = createApp({
  brandKey: "emirateslimo",
  config,
  router: indexRouter,
  webhooks: [{ path: "/api/webhook", handler: stripeWebhookHandler }],
  urlencodedLimit: "10mb",
});

export default app;

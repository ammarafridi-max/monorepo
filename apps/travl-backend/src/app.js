import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createApp } from "@travel-suite/backend-app/app";
import config from "./utils/config.js";
import indexRouter, { stripeWebhookHandler } from "./routes/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = createApp({
  brandKey: "travl",
  config,
  router: indexRouter,
  webhooks: [{ path: "/api/webhook", handler: stripeWebhookHandler }],
  staticMounts: [{ path: "/airlines", dir: join(__dirname, "public/airlines") }],
});

export default app;

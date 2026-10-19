import { requireEnv } from "@travel-suite/utils";
import config from "./config.js";

const isProduction = config.nodeEnv === "production";

const required = {
  mongoUri: "MONGO_URI",
  jwtSecret: "JWT_SECRET",
};

if (isProduction) {
  Object.assign(required, {
    "stripe.secretKey": "STRIPE_SECRET_KEY",
    "stripe.webhookSecret": "STRIPE_WEBHOOK_SECRET",
  });
}

try {
  requireEnv(config, required);
} catch (err) {
  console.error(`[emirateslimo-backend] startup aborted: ${err.message}`);
  process.exit(1);
}

if (isProduction && !config.brevoApiKey) {
  console.warn("[emirateslimo-backend] BREVO_API_KEY unset: transactional email disabled");
}

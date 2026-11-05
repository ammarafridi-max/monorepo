import { validateBackendEnv } from "@travel-suite/backend-app/validate-env";
import config from "./config.js";

validateBackendEnv(config, {
  name: "visawadi-backend",
  extraRequired: {
    userJwtSecret: "USER_JWT_SECRET (or JWT_SECRET)",
  },
});

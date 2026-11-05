import { validateBackendEnv } from "@travel-suite/backend-app/validate-env";
import config from "./config.js";

validateBackendEnv(config, { name: "emirateslimo-backend" });

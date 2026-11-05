import { validateBackendEnv } from "@travel-suite/backend-app/validate-env";
import config from "./config.js";

validateBackendEnv(config, {
  name: "thedt-backend",
  extraProductionRequired: {
    "wis.url": "WIS_URL",
    "wis.agencyId": "WIS_AGENCY_ID",
    "wis.agencyCode": "WIS_AGENCY_CODE",
  },
});

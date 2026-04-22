import { createWisClient } from "@travel-suite/insurance";
import config from "./config.js";

export const wis = createWisClient({
  url: config.wis.url,
  agencyId: config.wis.agencyId,
  agencyCode: config.wis.agencyCode,
  frontendUrl: config.frontendUrl,
});

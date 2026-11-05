import { createWisClient } from "@travel-suite/wis";
import { createWis } from "@travel-suite/backend-app/wis";
import config from "./config.js";

export const wis = createWis({ create: createWisClient, config });

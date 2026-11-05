import { createDb } from "@travel-suite/backend-app/db";
import config from "./config.js";

export const { connectDB, db } = createDb({ mongoUri: config.mongoUri });

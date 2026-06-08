import mongoose from "mongoose";
import { logger } from "@travel-suite/utils";
import config from "./config.js";

export async function connectDB() {
  await mongoose.connect(config.mongoUri);
  logger.info("MongoDB connected");
}

export const db = mongoose.connection;

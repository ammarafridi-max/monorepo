import { logger } from "@travel-suite/utils";
import { connectDB } from "./utils/db.js";
import config from "./utils/config.js";
import app from "./app.js";

const start = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info("travl-backend started", {
      port: config.port,
      env: config.nodeEnv,
    });
  });

  const shutdown = (signal) => {
    logger.info(`${signal} received, shutting down`);
    server.close(() => {
      logger.info("Server closed");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (err) => {
    logger.error("Unhandled rejection", { error: err });
    server.close(() => process.exit(1));
  });
};

start().catch((err) => {
  console.error("Failed to start server", err);
  process.exit(1);
});

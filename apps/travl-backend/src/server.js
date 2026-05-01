import { logger } from "@travel-suite/utils";
import { connectDB } from "./utils/db.js";
import config from "./utils/config.js";
import app from "./app.js";
import { pollAndProcess } from "./routes/index.js";

const start = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info("travl-backend started", {
      port: config.port,
      env: config.nodeEnv,
    });
  });

  // Start email support polling (every 5 minutes)
  try {
    pollAndProcess().catch((err) =>
      logger.error('[email-support] Initial poll failed', { error: err.message }),
    );
    setInterval(() => {
      pollAndProcess().catch((err) =>
        logger.error('[email-support] Poll failed', { error: err.message }),
      );
    }, 5 * 60 * 1000);
  } catch (err) {
    logger.error('[email-support] Failed to start polling', { error: err.message });
  }

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

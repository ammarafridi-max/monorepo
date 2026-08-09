import cron from "node-cron";
import { logger } from "@travel-suite/utils";
import { connectDB } from "./utils/db.js";
import config from "./utils/config.js";
import app from "./app.js";
import { runVisaReminderSweep } from "./routes/index.js";

// Next occurrence of `hour`:00 wall-clock in the given IANA timezone, as a real
// UTC instant. Uses Intl (bundled ICU) to read the current wall-clock and derive
// the zone offset — no dependency on system tzdata and DST-safe (Dubai has none).
function nextDailyRun(hour, timeZone) {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now).reduce((acc, p) => { acc[p.type] = p.value; return acc; }, {});
  const hr = parts.hour === '24' ? 0 : Number(parts.hour);
  const wallNow = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hr, +parts.minute, +parts.second);
  const offsetMs = wallNow - now.getTime();
  let wallTarget = Date.UTC(+parts.year, +parts.month - 1, +parts.day, hour, 0, 0);
  if (wallTarget <= wallNow) wallTarget += 86400000; // already past today → tomorrow
  return new Date(wallTarget - offsetMs);
}

const start = async () => {
  await connectDB();

  const server = app.listen(config.port, () => {
    logger.info("travl-backend started", {
      port: config.port,
      env: config.nodeEnv,
    });
  });


  // Daily visa-application reminder sweep at 09:00 Asia/Dubai. Guarded by
  // ENABLE_REMINDER_CRON so it runs on exactly one instance (never fan out).
  // The sweep is idempotent, but running it from a single machine avoids waste.
  if (config.enableReminderCron) {
    cron.schedule(
      '0 9 * * *',
      () => {
        runVisaReminderSweep()
          .then((summary) => logger.info('[visa-reminders] daily sweep', {
            trackASent: summary.trackA.sent.length,
            trackAEscalated: summary.trackA.escalated.length,
            trackBSent: summary.trackB.sent.length,
          }))
          .catch((err) => logger.error('[visa-reminders] daily sweep failed', { error: err.message }));
      },
      { timezone: 'Asia/Dubai' },
    );
    // Log the resolved next run in BOTH Asia/Dubai and UTC. If the timezone ever
    // silently fell back to UTC, these two strings would be identical — surfacing
    // the problem in Fly logs instead of it going unnoticed.
    const nextRun = nextDailyRun(9, 'Asia/Dubai');
    const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short', hour12: false }).format(nextRun);
    logger.info('[visa-reminders] daily reminder cron scheduled (09:00 Asia/Dubai)', {
      nextRunDubai: `${fmt('Asia/Dubai')} (Asia/Dubai)`,
      nextRunUtc: `${fmt('UTC')} (UTC)`,
    });
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

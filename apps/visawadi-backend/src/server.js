import "@travel-suite/utils/sentry";
import cron from "node-cron";
import { logger } from "@travel-suite/utils";
import { startServer } from "@travel-suite/backend-app/server";
import { connectDB } from "./utils/db.js";
import config from "./utils/config.js";
// must stay above the ./app.js import: routes/index.js builds the domain factories at module load
import "./utils/validateEnv.js";
import app from "./app.js";
import { runVisaReminderSweep } from "./routes/index.js";

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
  if (wallTarget <= wallNow) wallTarget += 86400000;
  return new Date(wallTarget - offsetMs);
}

function scheduleReminderSweep() {
  // The sweep is idempotent, but running it from a single machine avoids waste.
  if (!config.enableReminderCron) return;

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

  const nextRun = nextDailyRun(9, 'Asia/Dubai');
  const fmt = (tz) => new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'medium', timeStyle: 'short', hour12: false }).format(nextRun);
  logger.info('[visa-reminders] daily reminder cron scheduled (09:00 Asia/Dubai)', {
    nextRunDubai: `${fmt('Asia/Dubai')} (Asia/Dubai)`,
    nextRunUtc: `${fmt('UTC')} (UTC)`,
  });
}

startServer({
  app,
  config,
  name: "visawadi-backend",
  connect: connectDB,
  onListening: scheduleReminderSweep,
});

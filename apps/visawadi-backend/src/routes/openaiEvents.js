import { Router } from "express";

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 30;
const hits = new Map();

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of hits) if (now > entry.resetAt) hits.delete(ip);
}, 10 * 60 * 1000).unref?.();

function limiter(req, res, next) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip || "unknown";
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || now > entry.resetAt) {
    hits.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  entry.count += 1;
  if (entry.count > MAX_PER_WINDOW) return res.status(429).json({ status: "error" });
  next();
}

const clean = (value, max = 120) =>
  typeof value === "string" && value.trim() ? value.trim().slice(0, max) : undefined;

export function createOpenAIEventsRouter({ capi, frontendUrl, logger }) {
  const router = Router();

  router.post("/whatsapp-click", limiter, async (req, res) => {
    if (!capi?.isConfigured?.()) return res.status(204).end();

    const eventId = clean(req.body?.eventId, 80);
    if (!eventId) return res.status(400).json({ status: "error", message: "eventId is required" });

    try {
      await capi.sendEvent({
        type: "custom",
        customEventName: "whatsapp_click",
        eventId,
        sourceUrl: clean(req.body?.sourceUrl, 500) || frontendUrl || undefined,
        data: { type: "customer_action" },
        user: {
          oppref: clean(req.body?.oppref, 200),
          obref: clean(req.body?.obref, 200),
          clientIp: req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip,
          userAgent: clean(req.headers["user-agent"], 400),
        },
      });
    } catch (err) {
      logger?.warn("[openai-capi] whatsapp_click event failed", { eventId, error: err.message });
    }

    res.status(204).end();
  });

  return router;
}

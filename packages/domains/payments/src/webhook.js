import { logger } from '@travel-suite/utils';
import StripeWebhookEventSchema from './schemas/webhook-event.schema.js';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

/**
 * Returns an Express request handler for Stripe webhooks.
 * Mount it with express.raw() BEFORE json middleware in the brand app:
 *   app.post('/api/webhook', express.raw({ type: 'application/json' }), webhookHandler)
 *
 * @param {{
 *   stripe: import('stripe').Stripe,
 *   webhookSecret: string,
 *   db: import('mongoose').Connection,
 *   handlers: {
 *     ticket?: (session: object) => Promise<void>,
 *     insurance?: (session: object) => Promise<void>,
 *   }
 * }} deps
 * @returns {import('express').RequestHandler}
 */
export function createStripeWebhookHandler({ stripe, webhookSecret, db, handlers = {} }) {
  const StripeWebhookEvent = getOrRegisterModel(db, 'stripe-webhook-event', StripeWebhookEventSchema);

  return async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      if (!webhookSecret) {
        logger.error('[payments] Stripe webhook secret not configured');
        return res.status(400).send('Webhook secret not configured');
      }
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      logger.warn('[payments] Stripe signature verification failed', { error: err.message });
      return res.status(400).send('Invalid signature');
    }

    if (event.type !== 'checkout.session.completed') {
      return res.json({ received: true });
    }

    const session = event.data.object;

    const productType = session.metadata?.productType || 'unknown';
    const sessionId = session.metadata?.sessionId;

    try {
      // Fast path: an event we already fully processed is a true duplicate.
      const existing = await StripeWebhookEvent.findOne({ eventId: event.id });
      if (existing?.handlerSucceeded) {
        return res.json({ received: true, duplicate: true });
      }

      // Atomically CLAIM the event before doing any work. Stripe delivers the same
      // event concurrently and re-sends on timeout, so a plain findOne→create is
      // not enough — two deliveries would both run the handler and double-send
      // emails / double-issue. The unique index on eventId is the mutex: exactly
      // one caller wins this upsert; a concurrent caller fails the filter, hits the
      // duplicate-key error, and defers (409). A claim older than STALE_MS is
      // reclaimable so a crash mid-handler self-heals on the next Stripe retry.
      const STALE_MS = 5 * 60 * 1000;
      const staleBefore = new Date(Date.now() - STALE_MS);
      try {
        await StripeWebhookEvent.findOneAndUpdate(
          {
            eventId: event.id,
            handlerSucceeded: { $ne: true },
            $or: [
              { processingAt: null },
              { processingAt: { $exists: false } },
              { processingAt: { $lt: staleBefore } },
            ],
          },
          {
            $set: { processingAt: new Date() },
            $setOnInsert: {
              eventId: event.id,
              type: event.type,
              productType,
              sessionId,
              createdAtStripe: event.created ? new Date(event.created * 1000) : undefined,
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );
      } catch (err) {
        if (err?.code === 11000) {
          // Another delivery holds a fresh claim — let Stripe retry later.
          logger.warn('[payments] Webhook event already being processed, deferring', { eventId: event.id });
          return res.status(409).send('Webhook already being processed');
        }
        throw err;
      }

      if (session.payment_status !== 'paid') {
        // Not payable (yet). Release the claim so a later paid event can proceed.
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
        return res.json({ received: true, unpaid: true });
      }

      const handler = handlers[productType];
      if (!handler) {
        // Never mark an unhandled event as succeeded — that would permanently
        // swallow a real payment. Release the claim and surface it loudly.
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
        logger.error('[payments] No handler for productType', { productType, sessionId, eventId: event.id });
        return res.json({ received: true, unhandled: true });
      }

      await handler(session);

      // Mark as successfully handled so future deliveries short-circuit as duplicates.
      await StripeWebhookEvent.updateOne(
        { eventId: event.id },
        { $set: { handlerSucceeded: true, processingAt: null } },
      );

      return res.json({ received: true });
    } catch (err) {
      logger.error('[payments] Webhook processing failed', { eventId: event.id, error: err.message });
      // Release the claim so the next Stripe retry can reprocess immediately.
      try {
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
      } catch {
        /* best-effort claim release */
      }
      return res.status(500).send('Webhook handler failed');
    }
  };
}

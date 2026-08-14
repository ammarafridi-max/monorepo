import { logger } from '@travel-suite/utils';
import StripeWebhookEventSchema from './schemas/webhook-event.schema.js';

function getOrRegisterModel(conn, name, schema) {
  try { return conn.model(name); } catch { return conn.model(name, schema); }
}

// Must be mounted with express.raw() BEFORE the JSON body parser.
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
      const existing = await StripeWebhookEvent.findOne({ eventId: event.id });
      if (existing?.handlerSucceeded) {
        return res.json({ received: true, duplicate: true });
      }

      // Atomic claim on the unique eventId index: exactly one of Stripe's duplicate deliveries runs the handler; a claim older than STALE_MS is reclaimable.
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
          logger.warn('[payments] Webhook event already being processed, deferring', { eventId: event.id });
          return res.status(409).send('Webhook already being processed');
        }
        throw err;
      }

      if (session.payment_status !== 'paid') {
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
        return res.json({ received: true, unpaid: true });
      }

      const handler = handlers[productType];
      if (!handler) {
        // Never mark an unhandled event as succeeded — that would permanently swallow a real payment.
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
        logger.error('[payments] No handler for productType', { productType, sessionId, eventId: event.id });
        return res.json({ received: true, unhandled: true });
      }

      await handler(session);

      await StripeWebhookEvent.updateOne(
        { eventId: event.id },
        { $set: { handlerSucceeded: true, processingAt: null } },
      );

      return res.json({ received: true });
    } catch (err) {
      logger.error('[payments] Webhook processing failed', { eventId: event.id, error: err.message });
      try {
        await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { processingAt: null } });
      } catch {
      }
      return res.status(500).send('Webhook handler failed');
    }
  };
}

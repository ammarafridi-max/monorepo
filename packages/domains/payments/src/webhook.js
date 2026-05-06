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

    try {
      const already = await StripeWebhookEvent.findOne({ eventId: event.id });
      if (already) {
        // Only treat as a true duplicate if the handler previously succeeded.
        // If it failed (no handlerSucceeded flag), let this retry through.
        if (already.handlerSucceeded) {
          return res.json({ received: true, duplicate: true });
        }
        logger.warn('[payments] Retrying previously-failed webhook event', { eventId: event.id });
      }

      const productType = session.metadata?.productType || 'unknown';
      const sessionId = session.metadata?.sessionId;

      if (!already) {
        await StripeWebhookEvent.create({
          eventId: event.id,
          type: event.type,
          productType,
          sessionId,
          createdAtStripe: event.created ? new Date(event.created * 1000) : undefined,
        });
      }

      if (session.payment_status !== 'paid') {
        return res.json({ received: true, unpaid: true });
      }

      const handler = handlers[productType];
      if (handler) {
        await handler(session);
      } else {
        logger.warn('[payments] No handler for productType', { productType, sessionId });
      }

      // Mark as successfully handled so future retries are blocked
      await StripeWebhookEvent.updateOne({ eventId: event.id }, { $set: { handlerSucceeded: true } });

      return res.json({ received: true });
    } catch (err) {
      logger.error('[payments] Webhook processing failed', { eventId: event.id, error: err.message });
      return res.status(500).send('Webhook handler failed');
    }
  };
}

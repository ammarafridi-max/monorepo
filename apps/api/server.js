import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import express from 'express';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import Stripe from 'stripe';
import { Queue } from 'bullmq';
import {
  connectMongo,
  createRedisConnection,
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@headliner/shared';

/**
 * Headliner API (Phase 2: real money in).
 *
 * POST /checkout creates an order and a real Stripe Checkout Session. The
 * customer pays on Stripe, then Stripe calls POST /webhooks/stripe, which is the
 * idempotency boundary: it makes ONE atomic write (AWAITING_PAYMENT -> PAID) and
 * enqueues the pipeline exactly once. Replicate is still stubbed (Phase 3) and
 * there is no UI yet (Phase 4).
 */

// The server owns the price. Never trust the client for money.
const PRICE_CENTS = 3500;

const { MONGODB_URI, REDIS_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, PORT = 3001 } =
  process.env;
if (!MONGODB_URI) throw new Error('[api] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[api] REDIS_URL is required');
if (!STRIPE_SECRET_KEY) throw new Error('[api] STRIPE_SECRET_KEY is required');
if (!STRIPE_WEBHOOK_SECRET) throw new Error('[api] STRIPE_WEBHOOK_SECRET is required');

await connectMongo(MONGODB_URI);
console.log('[api] connected to MongoDB');

const stripe = new Stripe(STRIPE_SECRET_KEY);

const connection = createRedisConnection(REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });

// Enqueue options shared by every producer of the pipeline. jobId = orderId
// makes the enqueue idempotent: the same order can never be queued twice.
function pipelineJobOpts(orderId) {
  return {
    jobId: orderId,
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  };
}

const app = express();

/**
 * POST /webhooks/stripe  --  THE critical surface. Verify, one atomic write,
 * enqueue, 200. Nothing slow, no Replicate.
 *
 * This route is mounted BEFORE app.use(express.json()) and uses express.raw so
 * the JSON parser never runs on this path: stripe.webhooks.constructEvent needs
 * the exact raw bytes to verify the signature.
 */
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[api] webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // We only care about a completed checkout. Acknowledge everything else.
  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  try {
    // a. Find the order this session belongs to.
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
      // Should not happen given our flow: we always store the session id first.
      console.error(
        `[api] webhook: no order for checkout session ${session.id} (should not happen)`
      );
      return res.status(200).json({ received: true });
    }

    const orderId = order._id.toString();

    // b. Idempotent + atomic. Money figures come from STRIPE, never the client.
    try {
      await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
        amountPaidCents: session.amount_total,
        stripePaymentIntentId: session.payment_intent,
      });
    } catch (err) {
      // d. Already paid (a Stripe retry) or not in AWAITING_PAYMENT: do not
      //    enqueue again, but still acknowledge so Stripe stops retrying.
      if (err instanceof OrderTransitionConflictError) {
        console.log(
          `[api] webhook: order ${orderId} already processed (Stripe retry), skipping enqueue`
        );
        return res.status(200).json({ received: true });
      }
      throw err;
    }

    // c. Transition succeeded -> hand the order to the pipeline exactly once.
    await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId));
    console.log(`[api] webhook: order ${orderId} PAID and enqueued`);

    return res.status(200).json({ received: true });
  } catch (err) {
    // Unexpected failure: 500 lets Stripe retry the delivery later.
    console.error('[api] webhook handler error:', err);
    return res.status(500).json({ error: err.message });
  }
});

// Every route below this line gets a parsed JSON body.
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /checkout  --  create an order and a real Stripe Checkout Session.
 *
 * The server owns the price. The client cannot influence what is charged.
 *
 * Body: { customerEmail, uploadedImageUrls? }
 */
app.post('/checkout', async (req, res) => {
  try {
    const { customerEmail, uploadedImageUrls } = req.body ?? {};
    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail is required' });
    }

    // TODO (Phase 4): real uploaded URLs from storage. No file storage yet, so
    // fall back to a placeholder if the client did not supply any.
    const images =
      Array.isArray(uploadedImageUrls) && uploadedImageUrls.length > 0
        ? uploadedImageUrls
        : ['https://placehold.co/512x512?text=selfie'];

    // Create the order first so we have an id to put in the session metadata.
    // amountPaidCents is intentionally NOT set yet: it is written from Stripe in
    // the webhook once payment is confirmed.
    const order = await Order.create({
      customerEmail,
      uploadedImageUrls: images,
    });
    const orderId = order._id.toString();

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: PRICE_CENTS,
            product_data: { name: 'Headliner professional headshots' },
          },
        },
      ],
      metadata: { orderId },
      // TODO (Phase 4): real success/cancel URLs on the web app.
      success_url: `http://localhost:3000/success?orderId=${orderId}`,
      cancel_url: `http://localhost:3000/cancel?orderId=${orderId}`,
    });

    // The session id is our idempotency anchor: the webhook finds the order by it.
    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({ orderId, checkoutUrl: session.url });
  } catch (err) {
    console.error('[api] POST /checkout failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

// GET /orders/:id  --  watch an order's status change over time.
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});

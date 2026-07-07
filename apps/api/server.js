import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import Stripe from 'stripe';
import { Queue } from 'bullmq';
import {
  connectMongo,
  createRedisConnection,
  createStorage,
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@headliner/shared';

/**
 * Headliner API (Phase 4: uploads + delivery).
 *
 * - POST /uploads/presign returns presigned PUT URLs so the browser uploads
 *   selfies DIRECTLY to R2. Bytes never pass through this service.
 * - POST /checkout creates an order with the customer's real uploaded image URLs
 *   and a Stripe Checkout Session. The server owns the price.
 * - POST /webhooks/stripe is the idempotency boundary: one atomic write
 *   (AWAITING_PAYMENT -> PAID) and one enqueue.
 * - GET /orders/:id returns a PUBLIC view (no cost, no Stripe/Replicate internals)
 *   for the success page to poll.
 */

// The server owns the price. Never trust the client for money.
const PRICE_CENTS = 3500;
// Reject absurd upload batches. A face fine-tune wants ~10-15 photos.
const MAX_UPLOAD_FILES = 20;

const {
  MONGODB_URI,
  REDIS_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  WEB_BASE_URL = 'http://localhost:3000',
  PORT = 3001,
} = process.env;
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

/**
 * The PUBLIC projection of an order. Everything the success page needs, and
 * nothing it should not see: no computeCostCents (our margin), no Stripe ids, no
 * Replicate training internals.
 */
function toPublicOrder(order) {
  return {
    orderId: order._id.toString(),
    status: order.status,
    customerEmail: order.customerEmail,
    resultImageUrls: order.resultImageUrls ?? [],
    createdAt: order.createdAt,
    deliveredAt: order.deliveredAt ?? null,
    // A calm, non-technical hint for a failed order (Phase 5 owns refunds).
    failed: order.status === ORDER_STATES.FAILED,
  };
}

const app = express();

// The web app is a separate origin (localhost:3000 in dev). Allow it to call
// the JSON endpoints. The webhook is server-to-server and needs no CORS.
app.use(cors({ origin: WEB_BASE_URL }));

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
 * POST /uploads/presign  --  hand the browser presigned PUT URLs so it uploads
 * selfies DIRECTLY to R2. We never see the bytes.
 *
 * Body: { files: [{ filename, contentType }] }
 * Returns: { uploads: [{ uploadUrl, publicUrl, key, contentType }] }
 */
app.post('/uploads/presign', async (req, res) => {
  try {
    const { files } = req.body ?? {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files must be a non-empty array' });
    }
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ error: `at most ${MAX_UPLOAD_FILES} files` });
    }
    for (const f of files) {
      if (!f || typeof f.contentType !== 'string' || !f.contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'each file needs an image/* contentType' });
      }
    }

    const storage = createStorage();
    const uploads = await Promise.all(
      files.map(async (f) => {
        // A fresh uuid folder per file keeps names unique and un-guessable.
        const safeName = String(f.filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_');
        const key = `uploads/${randomUUID()}/${safeName}`;
        const uploadUrl = await storage.presignPut(key, f.contentType);
        return { uploadUrl, publicUrl: storage.publicUrl(key), key, contentType: f.contentType };
      })
    );

    return res.json({ uploads });
  } catch (err) {
    console.error('[api] POST /uploads/presign failed:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /checkout  --  create an order and a real Stripe Checkout Session.
 *
 * The server owns the price. The client cannot influence what is charged.
 *
 * Body: { customerEmail, uploadedImageUrls: string[] }  (real R2 URLs from the
 * direct upload above)
 */
app.post('/checkout', async (req, res) => {
  try {
    const { customerEmail, uploadedImageUrls } = req.body ?? {};
    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail is required' });
    }
    if (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }

    // Create the order first so we have an id to put in the session metadata.
    // amountPaidCents is intentionally NOT set yet: it is written from Stripe in
    // the webhook once payment is confirmed.
    const order = await Order.create({
      customerEmail,
      uploadedImageUrls,
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
      success_url: `${WEB_BASE_URL}/success?orderId=${orderId}`,
      cancel_url: `${WEB_BASE_URL}/cancel?orderId=${orderId}`,
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

// GET /orders/:id  --  the success page polls this. Returns the PUBLIC view only.
app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    return res.json(toPublicOrder(order));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});

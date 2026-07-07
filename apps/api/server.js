import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import express from 'express';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import { Queue } from 'bullmq';
import {
  connectMongo,
  createRedisConnection,
  Order,
  ORDER_STATES,
  QUEUE_NAMES,
  transitionOrder,
} from '@headliner/shared';

/**
 * Headliner API (Phase 1: walking skeleton).
 *
 * Produces order-pipeline jobs. In this phase the money-in step is FAKED by
 * POST /test/orders so a fake order can traverse the full pipeline. No Stripe.
 */

const { MONGODB_URI, REDIS_URL, PORT = 3001 } = process.env;
if (!MONGODB_URI) throw new Error('[api] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[api] REDIS_URL is required');

await connectMongo(MONGODB_URI);
console.log('[api] connected to MongoDB');

const connection = createRedisConnection(REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

/**
 * POST /test/orders  --  FAKE Stripe. Remove in Phase 2.
 *
 * TODO (Phase 2): replace with a real Stripe Checkout session + webhook. The
 * webhook, not this route, becomes the idempotency boundary keyed on
 * stripeSessionId.
 *
 * Body: { customerEmail }
 */
app.post('/test/orders', async (req, res) => {
  try {
    const { customerEmail } = req.body ?? {};
    if (!customerEmail) {
      return res.status(400).json({ error: 'customerEmail is required' });
    }

    // 1. Create the order (defaults to AWAITING_PAYMENT).
    const order = await Order.create({ customerEmail });
    const orderId = order._id.toString();

    // 2. Fake the payment Stripe would confirm.
    await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
      amountPaidCents: 3500,
    });

    // 3. Hand the order to the pipeline. jobId = orderId makes the enqueue
    //    idempotent: the same order can never be queued twice.
    await orderPipeline.add(
      'process-order',
      { orderId },
      {
        jobId: orderId,
        attempts: 3,
        backoff: { type: 'exponential', delay: 1000 },
        removeOnComplete: true,
      }
    );

    // 4. Done.
    return res.status(201).json({ orderId });
  } catch (err) {
    console.error('[api] POST /test/orders failed:', err);
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

import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import {
  connectMongo,
  createRedisConnection,
  Order,
  ORDER_STATES,
  QUEUE_NAMES,
  transitionOrder,
} from '@headliner/shared';

/**
 * Headliner worker (Phase 1: walking skeleton).
 *
 * Consumes order-pipeline jobs and drives an order through TRAINING and
 * GENERATING to DELIVERED. Every external call is STUBBED with a sleep in this
 * phase. No Replicate.
 *
 * The processor is RESUMABLE: it never trusts in-memory progress. Each step
 * re-reads the order's CURRENT status from Mongo and advances one step, so a
 * crash and restart continues from wherever the order actually is.
 */

const { MONGODB_URI, REDIS_URL } = process.env;
if (!MONGODB_URI) throw new Error('[worker] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[worker] REDIS_URL is required');

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const connection = createRedisConnection(REDIS_URL);

const worker = new Worker(
  QUEUE_NAMES.ORDER_PIPELINE,
  async (job) => {
    const { orderId } = job.data;
    console.log(`[worker] picked up job ${job.id} for order ${orderId}`);

    // Guarded loop: re-read the order each iteration and take exactly one step
    // based on its current status. Entering at TRAINING or GENERATING (e.g.
    // after a restart) resumes correctly because we branch on what Mongo says,
    // not on where we think we are.
    while (true) {
      const order = await Order.findById(orderId);
      if (!order) throw new Error(`order ${orderId} not found`);

      switch (order.status) {
        case ORDER_STATES.PAID:
          // Nothing external. Move straight into training.
          await transitionOrder(orderId, ORDER_STATES.PAID, ORDER_STATES.TRAINING);
          break;

        case ORDER_STATES.TRAINING:
          // TODO (Phase 3): start + await real Replicate training here.
          await sleep(2500);
          await transitionOrder(orderId, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING);
          break;

        case ORDER_STATES.GENERATING:
          // TODO (Phase 3): start + await real Replicate generation here.
          await sleep(2500);
          await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
          break;

        case ORDER_STATES.DELIVERED:
          // Already done. Re-running the job is a safe no-op.
          console.log(`[worker] order ${orderId} already DELIVERED, nothing to do`);
          return;

        default:
          throw new Error(
            `order ${orderId} is in unexpected status ${order.status} for the pipeline`
          );
      }
    }
  },
  { connection, concurrency: 1 }
);

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on('failed', async (job, err) => {
  const attempts = job?.opts?.attempts ?? 0;
  console.error(
    `[worker] job ${job?.id} failed (attempt ${job?.attemptsMade}/${attempts}): ${err.message}`
  );

  if (!job) return;

  // Only give up once BullMQ has exhausted all retries. Before that, let the
  // queue back off and try again.
  if (job.attemptsMade < attempts) return;

  // TODO (Phase 5): auto-refund on FAILED. For now just reach the FAILED state.
  try {
    const order = await Order.findById(job.data.orderId);
    if (!order) return;
    // Terminal states never move again.
    if (order.status === ORDER_STATES.DELIVERED || order.status === ORDER_STATES.FAILED) {
      return;
    }
    await transitionOrder(order._id.toString(), order.status, ORDER_STATES.FAILED, {
      error: { stage: order.status, message: err.message, at: new Date() },
    });
  } catch (e) {
    console.error(`[worker] could not move order to FAILED: ${e.message}`);
  }
});

console.log(
  `[worker] started, listening on '${QUEUE_NAMES.ORDER_PIPELINE}' (concurrency 1)`
);

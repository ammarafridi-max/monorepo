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
import { PROMPTS } from './replicateClient.js';
import { createPipeline } from './pipeline.js';

/**
 * Headliner worker (Phase 3: real Replicate compute).
 *
 * Consumes order-pipeline jobs and drives an order PAID -> TRAINING ->
 * GENERATING -> DELIVERED. The resumable, per-stage-idempotent logic lives in
 * pipeline.js; the Replicate client is injected so it can be swapped for a fake
 * in tests. Set USE_FAKE_REPLICATE=1 to drive the worker with the in-memory fake
 * (no real training/generation, no cost) -- the real client is the default.
 */

const USE_FAKE_REPLICATE = process.env.USE_FAKE_REPLICATE === '1';

const { MONGODB_URI, REDIS_URL, TEST_IMAGE_ZIP_URL } = process.env;
if (!MONGODB_URI) throw new Error('[worker] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[worker] REDIS_URL is required');

if (!USE_FAKE_REPLICATE) {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error('[worker] REPLICATE_API_TOKEN is required');
  if (!process.env.REPLICATE_DESTINATION_MODEL)
    throw new Error('[worker] REPLICATE_DESTINATION_MODEL is required (owner/name)');
  // TODO (Phase 4): replace with the order's real uploaded images (a zip built
  // from order.uploadedImageUrls in storage). Until uploads exist we train every
  // order on one shared, publicly reachable test zip of selfies.
  if (!TEST_IMAGE_ZIP_URL) throw new Error('[worker] TEST_IMAGE_ZIP_URL is required until Phase 4');
}

// Pick the real Replicate client or the in-memory fake. The fake exposes the
// same startTraining/pollTraining/startGeneration/pollGeneration interface.
const client = USE_FAKE_REPLICATE
  ? await import('./replicateClient.fake.js')
  : await import('./replicateClient.js');
if (USE_FAKE_REPLICATE) console.warn('[worker] USE_FAKE_REPLICATE=1: using the in-memory fake client');

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

const pipeline = createPipeline({
  client,
  prompts: PROMPTS,
  imageZipUrl: TEST_IMAGE_ZIP_URL,
});

const connection = createRedisConnection(REDIS_URL);

const worker = new Worker(
  QUEUE_NAMES.ORDER_PIPELINE,
  async (job) => {
    const { orderId } = job.data;
    console.log(`[worker] picked up job ${job.id} for order ${orderId}`);
    await pipeline.processOrder(orderId);
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

console.log(`[worker] started, listening on '${QUEUE_NAMES.ORDER_PIPELINE}' (concurrency 1)`);

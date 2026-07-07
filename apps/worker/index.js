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
import {
  PROMPTS,
  startTraining,
  pollTraining,
  startGeneration,
  pollGeneration,
} from './replicateClient.js';

/**
 * Headliner worker (Phase 3: real Replicate compute).
 *
 * Consumes order-pipeline jobs and drives an order TRAINING -> GENERATING ->
 * DELIVERED using real Replicate training + generation. Replicate calls live in
 * replicateClient.js (bounded timeout + retry, throws on final failure).
 *
 * The processor is RESUMABLE and each external stage is individually IDEMPOTENT.
 * It never trusts in-memory progress: every iteration re-reads the order's
 * CURRENT status from Mongo and takes one step. Within a stage, ids returned by
 * Replicate (trainingId, predictionIds) are persisted to Mongo BEFORE we start
 * polling, so a crash mid-flight reattaches to the in-flight work instead of
 * starting a new training or regenerating an already-started image.
 */

const { MONGODB_URI, REDIS_URL, TEST_IMAGE_ZIP_URL } = process.env;
if (!MONGODB_URI) throw new Error('[worker] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[worker] REDIS_URL is required');
if (!process.env.REPLICATE_API_TOKEN) throw new Error('[worker] REPLICATE_API_TOKEN is required');
if (!process.env.REPLICATE_DESTINATION_MODEL)
  throw new Error('[worker] REPLICATE_DESTINATION_MODEL is required (owner/name)');
// TODO (Phase 4): replace with the order's real uploaded images (a zip built
// from order.uploadedImageUrls in storage). Until uploads exist we train every
// order on one shared, publicly reachable test zip of selfies.
if (!TEST_IMAGE_ZIP_URL) throw new Error('[worker] TEST_IMAGE_ZIP_URL is required until Phase 4');

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// How long a stage will poll before giving up and throwing (which becomes a
// BullMQ retry, then a FAILED order once attempts are exhausted). Real Flux
// training takes minutes; generation is quick. Generous but bounded.
const POLL_INTERVAL_MS = 8000;
const TRAINING_MAX_WAIT_MS = 30 * 60 * 1000; // 30 min
const GENERATION_MAX_WAIT_MS = 6 * 60 * 1000; // 6 min per image

const usdToCents = (usd) => Math.round((usd || 0) * 100);

/**
 * Poll a single Replicate resource to a terminal state. Returns the final
 * snapshot (status 'succeeded' or 'failed'); throws if it never settles within
 * maxWaitMs. The per-call timeout/retry lives inside pollFn; this is the outer
 * wait loop the worker owns so the stage stays resumable.
 *
 * @param {() => Promise<{status: string}>} pollFn
 */
async function pollUntilSettled(pollFn, { maxWaitMs, label }) {
  const deadline = Date.now() + maxWaitMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snapshot = await pollFn();
    if (snapshot.status !== 'processing') return snapshot;
    if (Date.now() > deadline) {
      throw new Error(`[worker] ${label} did not finish within ${maxWaitMs}ms`);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

/**
 * TRAINING stage. Idempotent + resumable:
 *   - already have a trained version  -> skip straight to GENERATING
 *   - already started a training       -> reattach to it, never start a new one
 *   - otherwise                        -> start, persist the id, then poll
 */
async function runTrainingStage(orderId, order) {
  // Already trained (e.g. crash after persisting the version but before the
  // transition). Never retrain: just advance.
  if (order.replicate?.trainedModelVersion) {
    await transitionOrder(orderId, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING);
    return;
  }

  let trainingId = order.replicate?.trainingId;

  if (!trainingId) {
    // TODO (Phase 4): use the order's real uploaded images instead of the shared
    // test zip.
    const started = await startTraining(TEST_IMAGE_ZIP_URL);
    trainingId = started.trainingId;
    // Persist BEFORE polling so a crash here reattaches instead of retraining.
    await Order.updateOne({ _id: orderId }, { $set: { 'replicate.trainingId': trainingId } });
    console.log(`[worker] order ${orderId} training started: ${trainingId}`);
  } else {
    console.log(`[worker] order ${orderId} reattaching to training ${trainingId}`);
  }

  const result = await pollUntilSettled(() => pollTraining(trainingId), {
    maxWaitMs: TRAINING_MAX_WAIT_MS,
    label: `training ${trainingId}`,
  });

  if (result.status !== 'succeeded' || !result.trainedModelVersion) {
    throw new Error(`[worker] training ${trainingId} failed for order ${orderId}`);
  }

  // Persist the trained version + accumulate cost, then transition. If we crash
  // after this $set but before the transition, the guard at the top of this
  // function skips retraining on the next run.
  await Order.updateOne(
    { _id: orderId },
    {
      $set: { 'replicate.trainedModelVersion': result.trainedModelVersion },
      $inc: { computeCostCents: usdToCents(result.costUsd) },
    }
  );
  console.log(`[worker] order ${orderId} trained: ${result.trainedModelVersion}`);

  await transitionOrder(orderId, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING);
}

/**
 * GENERATION stage. One prediction per prompt, index-aligned with PROMPTS.
 * Idempotent + resumable per slot:
 *   - a slot that already has a predictionId is never started again
 *   - a slot that already has a result image is never polled/collected again
 * Every id and every finished image is persisted immediately, so a crash resumes
 * exactly the missing slots.
 */
async function runGenerationStage(orderId, order) {
  const modelVersion = order.replicate?.trainedModelVersion;
  if (!modelVersion) {
    throw new Error(`[worker] order ${orderId} is GENERATING without a trained model version`);
  }

  const generationIds = [...(order.replicate?.generationIds ?? [])];
  const resultImageUrls = [...(order.resultImageUrls ?? [])];

  // Phase 1: ensure every prompt slot has a started prediction, persisting each
  // id BEFORE any polling so a crash reattaches instead of regenerating.
  for (let i = 0; i < PROMPTS.length; i++) {
    if (generationIds[i]) continue;
    const { predictionId } = await startGeneration(modelVersion, PROMPTS[i]);
    generationIds[i] = predictionId;
    await Order.updateOne(
      { _id: orderId },
      { $set: { [`replicate.generationIds.${i}`]: predictionId } }
    );
    console.log(`[worker] order ${orderId} generation ${i} started: ${predictionId}`);
  }

  // Phase 2: collect each still-missing image, persisting per slot so finished
  // work survives a crash and is never re-collected (nor its cost double-counted).
  for (let i = 0; i < PROMPTS.length; i++) {
    if (resultImageUrls[i]) continue;
    const result = await pollUntilSettled(() => pollGeneration(generationIds[i]), {
      maxWaitMs: GENERATION_MAX_WAIT_MS,
      label: `generation ${generationIds[i]}`,
    });
    if (result.status !== 'succeeded' || !result.imageUrl) {
      throw new Error(`[worker] generation ${generationIds[i]} failed for order ${orderId}`);
    }
    resultImageUrls[i] = result.imageUrl;
    await Order.updateOne(
      { _id: orderId },
      {
        $set: { [`resultImageUrls.${i}`]: result.imageUrl },
        $inc: { computeCostCents: usdToCents(result.costUsd) },
      }
    );
    console.log(`[worker] order ${orderId} generation ${i} done (${i + 1}/${PROMPTS.length})`);
  }

  await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
}

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
          await runTrainingStage(orderId, order);
          break;

        case ORDER_STATES.GENERATING:
          await runGenerationStage(orderId, order);
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

console.log(`[worker] started, listening on '${QUEUE_NAMES.ORDER_PIPELINE}' (concurrency 1)`);

import { Order, ORDER_STATES, transitionOrder } from '@headliner/shared';

/**
 * The order pipeline, factored out of index.js so it can be driven in tests with
 * an injected (fake) Replicate client and an ephemeral Mongo. It has NO
 * import-time side effects: no env reads, no Mongo/Redis connect, no queue.
 *
 * The processor is RESUMABLE and each external stage is individually IDEMPOTENT:
 * every step re-reads the order's CURRENT status from Mongo and takes one step,
 * and any id returned by Replicate (trainingId, predictionIds) is persisted
 * BEFORE polling so a crash mid-flight reattaches to the in-flight work instead
 * of starting a new training or regenerating an already-started image.
 */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usdToCents = (usd) => Math.round((usd || 0) * 100);

// Real-operation poll timings. Real Flux training takes minutes; generation is
// quick. Tests override these to run fast.
export const DEFAULT_POLL_INTERVAL_MS = 8000;
export const DEFAULT_TRAINING_MAX_WAIT_MS = 30 * 60 * 1000; // 30 min
export const DEFAULT_GENERATION_MAX_WAIT_MS = 6 * 60 * 1000; // 6 min per image

/**
 * @typedef {Object} ReplicateClient
 * @property {(imageZipUrl: string) => Promise<{ trainingId: string }>} startTraining
 * @property {(trainingId: string) => Promise<{ status: string, trainedModelVersion?: string, costUsd?: number }>} pollTraining
 * @property {(modelVersion: string, prompt: string) => Promise<{ predictionId: string }>} startGeneration
 * @property {(predictionId: string) => Promise<{ status: string, imageUrl?: string, costUsd?: number }>} pollGeneration
 */

/**
 * Build the pipeline against an injected Replicate client.
 *
 * @param {Object} opts
 * @param {ReplicateClient} opts.client
 * @param {readonly string[]} opts.prompts - one prompt per output image
 * @param {(order: any) => Promise<string>} [opts.resolveTrainingZip] - returns the
 *        zip URL to train this order on (built from its real uploaded images)
 * @param {string} [opts.imageZipUrl] - static fallback zip URL when no resolver
 *        is provided (used by tests and by the TEST_IMAGE_ZIP_URL dev override)
 * @param {(orderId: string) => Promise<void>} [opts.onDelivered] - idempotent
 *        side effect to run when an order is DELIVERED (e.g. send the email)
 * @param {(orderId: string) => Promise<void>} [opts.onFailed] - idempotent side
 *        effect to run when a FAILED order is (re)entered (e.g. issue a refund)
 * @param {number} [opts.pollIntervalMs]
 * @param {number} [opts.trainingMaxWaitMs]
 * @param {number} [opts.generationMaxWaitMs]
 */
export function createPipeline({
  client,
  prompts,
  resolveTrainingZip,
  imageZipUrl,
  onDelivered,
  onFailed,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  trainingMaxWaitMs = DEFAULT_TRAINING_MAX_WAIT_MS,
  generationMaxWaitMs = DEFAULT_GENERATION_MAX_WAIT_MS,
}) {
  /**
   * Poll one Replicate resource to a terminal state. Returns the final snapshot
   * ('succeeded' or 'failed'); throws if it never settles within maxWaitMs. The
   * per-call timeout/retry lives inside pollFn; this is the outer wait loop the
   * worker owns so the stage stays resumable.
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
      await sleep(pollIntervalMs);
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
      // Build (or resolve) the zip of THIS order's real uploaded selfies. The
      // static imageZipUrl is only a fallback for tests / the dev override.
      const zipUrl = resolveTrainingZip ? await resolveTrainingZip(order) : imageZipUrl;
      if (!zipUrl) {
        throw new Error(`[worker] order ${orderId} has no training images to train on`);
      }
      const started = await client.startTraining(zipUrl);
      trainingId = started.trainingId;
      // Persist BEFORE polling so a crash here reattaches instead of retraining.
      await Order.updateOne({ _id: orderId }, { $set: { 'replicate.trainingId': trainingId } });
      console.log(`[worker] order ${orderId} training started: ${trainingId}`);
    } else {
      console.log(`[worker] order ${orderId} reattaching to training ${trainingId}`);
    }

    const result = await pollUntilSettled(() => client.pollTraining(trainingId), {
      maxWaitMs: trainingMaxWaitMs,
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
   * GENERATION stage. One prediction per prompt, index-aligned with `prompts`.
   * Idempotent + resumable per slot, in two passes:
   *
   *   Pass 1 (start):   a slot is started ONLY if it has no predictionId yet.
   *                     A slot that already has a persisted predictionId is left
   *                     untouched -- it is NEVER started again.
   *   Pass 2 (collect): a slot is polled ONLY if it has no result image yet, and
   *                     it reattaches to its EXISTING predictionId.
   *
   * So the only slots that ever call startGeneration are those with no id at all;
   * every started-but-not-finished slot reattaches. Each id and each finished
   * image is persisted immediately, so a crash resumes exactly the missing slots.
   */
  async function runGenerationStage(orderId, order) {
    const modelVersion = order.replicate?.trainedModelVersion;
    if (!modelVersion) {
      throw new Error(`[worker] order ${orderId} is GENERATING without a trained model version`);
    }

    const generationIds = [...(order.replicate?.generationIds ?? [])];
    const resultImageUrls = [...(order.resultImageUrls ?? [])];

    // Pass 1: ensure every prompt slot has a started prediction, persisting each
    // id BEFORE any polling so a crash reattaches instead of regenerating. Slots
    // that already carry an id are skipped -> never double-started.
    for (let i = 0; i < prompts.length; i++) {
      if (generationIds[i]) continue;
      const { predictionId } = await client.startGeneration(modelVersion, prompts[i]);
      generationIds[i] = predictionId;
      await Order.updateOne(
        { _id: orderId },
        { $set: { [`replicate.generationIds.${i}`]: predictionId } }
      );
      console.log(`[worker] order ${orderId} generation ${i} started: ${predictionId}`);
    }

    // Pass 2: collect each still-missing image by REATTACHING to its existing
    // predictionId. Never starts a generation here. Persists per slot so finished
    // work survives a crash and is never re-collected (nor its cost double-counted).
    for (let i = 0; i < prompts.length; i++) {
      if (resultImageUrls[i]) continue;
      const predictionId = generationIds[i];
      // Invariant: pass 1 guarantees every slot has an id before we poll.
      if (!predictionId) {
        throw new Error(`[worker] order ${orderId} generation slot ${i} has no predictionId to reattach`);
      }
      const result = await pollUntilSettled(() => client.pollGeneration(predictionId), {
        maxWaitMs: generationMaxWaitMs,
        label: `generation ${predictionId}`,
      });
      if (result.status !== 'succeeded' || !result.imageUrl) {
        throw new Error(`[worker] generation ${predictionId} failed for order ${orderId}`);
      }
      resultImageUrls[i] = result.imageUrl;
      await Order.updateOne(
        { _id: orderId },
        {
          $set: { [`resultImageUrls.${i}`]: result.imageUrl },
          $inc: { computeCostCents: usdToCents(result.costUsd) },
        }
      );
      console.log(`[worker] order ${orderId} generation ${i} done (${i + 1}/${prompts.length})`);
    }

    await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
  }

  /**
   * Drive one order forward from wherever it currently is. Guarded loop: re-read
   * the order each iteration and take exactly one step based on its CURRENT
   * status, so entering at TRAINING or GENERATING (e.g. after a restart) resumes
   * correctly.
   */
  async function processOrder(orderId) {
    // eslint-disable-next-line no-constant-condition
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
          // Reached delivery. Run the idempotent delivery side effect (email)
          // here, NOT only on the fresh transition: entering this case after a
          // restart must still guarantee the email goes out exactly once. The
          // hook's own deliveredEmailSentAt guard makes repeat entry a no-op.
          if (onDelivered) await onDelivered(orderId);
          console.log(`[worker] order ${orderId} DELIVERED`);
          return;

        case ORDER_STATES.FAILED:
          // Re-entering a failed order (e.g. a manual requeue). Run the
          // idempotent failure side effect (refund) and stop. Its refundedAt
          // guard makes repeat entry a no-op; never throw here.
          if (onFailed) await onFailed(orderId);
          console.log(`[worker] order ${orderId} FAILED (terminal)`);
          return;

        default:
          throw new Error(
            `order ${orderId} is in unexpected status ${order.status} for the pipeline`
          );
      }
    }
  }

  /**
   * Drive an order into FAILED and run the idempotent failure side effect
   * (refund). Called when processOrder has exhausted its retries. Kept here (not
   * in the queue's failure handler) so the FAILED transition, its recorded
   * error, and the refund are one testable unit:
   *   - DELIVERED: terminal and never a failure to refund (e.g. a job that
   *     landed here only because the delivery email exhausted its retries).
   *   - already FAILED: do not re-transition, but still ensure the refund went
   *     out (onFailed is idempotent).
   *   - otherwise: transition to FAILED, ALWAYS recording where and why, then
   *     refund.
   *
   * @param {string} orderId
   * @param {Error} err
   */
  async function failOrder(orderId, err) {
    const order = await Order.findById(orderId);
    if (!order) return;

    if (order.status === ORDER_STATES.DELIVERED) return;

    if (order.status === ORDER_STATES.FAILED) {
      if (onFailed) await onFailed(orderId);
      return;
    }

    await transitionOrder(orderId, order.status, ORDER_STATES.FAILED, {
      error: { stage: order.status, message: err.message, at: new Date() },
    });
    if (onFailed) await onFailed(orderId);
  }

  return { processOrder, failOrder, runTrainingStage, runGenerationStage, pollUntilSettled };
}

import { Order, ORDER_STATES, transitionOrder } from '@picturesk/shared';

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
// How long a training may sit "starting" (accepted but no hardware allocated)
// before we treat it as wedged, cancel it, and start a fresh one.
export const DEFAULT_TRAINING_STARTING_MAX_MS = 5 * 60 * 1000; // 5 min
// How many times to cancel-and-restart a wedged training before giving up (fail + refund).
export const DEFAULT_MAX_TRAINING_RESTARTS = 3;

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
 * @param {(order: any) => string[]} opts.buildPrompts - builds THIS order's prompts
 *        from its selections (via the shared catalog buildPrompts). Called per
 *        order at generation time. Candidates cycle through the returned list
 *        (prompts[i % prompts.length]) if it is shorter than generateCount.
 * @param {(candidateImageUrl: string, referenceImageUrls: readonly string[]) => Promise<{ score: number, costUsd?: number }>} [opts.scoreIdentity]
 *        identity-fidelity scorer used to cull off-identity candidates; higher
 *        score == more like the customer's real selfies. Injectable/stubbable.
 * @param {number} [opts.generateCount] - how many CANDIDATES to generate. Must be
 *        >= deliverCount.
 * @param {number} [opts.deliverCount] - how many candidates to DELIVER after
 *        scoring. Clamped to <= generateCount.
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
  buildPrompts,
  scoreIdentity = async () => ({ score: 0, costUsd: 0 }),
  swapFace,
  enhanceFace,
  persistImage,
  generateCount = 14,
  deliverCount = 14,
  resolveTrainingZip,
  imageZipUrl,
  onDelivered,
  onFailed,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS,
  trainingMaxWaitMs = DEFAULT_TRAINING_MAX_WAIT_MS,
  startingMaxWaitMs = DEFAULT_TRAINING_STARTING_MAX_MS,
  maxTrainingRestarts = DEFAULT_MAX_TRAINING_RESTARTS,
  generationMaxWaitMs = DEFAULT_GENERATION_MAX_WAIT_MS,
}) {
  // Never try to deliver more than we generate. index.js asserts this at startup
  // from env; clamp here too so the pipeline is safe however it is constructed.
  const deliverN = Math.min(deliverCount, generateCount);
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

    // Poll to a terminal state, but distinguish "running slowly" from "never got
    // hardware". A training queued in "starting" (allocated === false) that does not
    // get hardware within startingMaxWaitMs is WEDGED: cancel it and start a fresh
    // one (bounded by maxTrainingRestarts), rather than reattaching to a dead training
    // for the full 30-minute window. Once it is genuinely running (allocated), the
    // normal trainingMaxWaitMs applies.
    const runningDeadline = Date.now() + trainingMaxWaitMs;
    const allocationDeadline = Date.now() + startingMaxWaitMs;
    let result;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      result = await client.pollTraining(trainingId);
      if (result.status === 'succeeded') break;
      if (result.status === 'failed') {
        throw new Error(`[worker] training ${trainingId} failed for order ${orderId}`);
      }
      // status === 'processing'. `allocated !== false` treats an unknown/absent flag
      // as running, so any client that does not report allocation keeps the old behaviour.
      const running = result.allocated !== false;
      if (running) {
        if (Date.now() > runningDeadline) {
          throw new Error(`[worker] training ${trainingId} did not finish within ${trainingMaxWaitMs}ms`);
        }
      } else if (Date.now() > allocationDeadline) {
        const restarts = order.replicate?.trainingRestarts ?? 0;
        console.warn(
          `[worker] order ${orderId} training ${trainingId} never got hardware within ${startingMaxWaitMs}ms (restart ${restarts}/${maxTrainingRestarts}); cancelling`
        );
        if (client.cancelTraining) await client.cancelTraining(trainingId).catch(() => {});
        if (restarts >= maxTrainingRestarts) {
          throw new Error(
            `[worker] order ${orderId} training could not get hardware after ${restarts + 1} attempts`
          );
        }
        // Clear the wedged id + bump the restart counter, then return: processOrder
        // re-enters TRAINING and starts a FRESH training (never reattaches to this one).
        await Order.updateOne(
          { _id: orderId },
          { $unset: { 'replicate.trainingId': '' }, $inc: { 'replicate.trainingRestarts': 1 } }
        );
        return;
      }
      await sleep(pollIntervalMs);
    }

    if (!result.trainedModelVersion) {
      throw new Error(`[worker] training ${trainingId} succeeded without a model version for order ${orderId}`);
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
   * GENERATION stage. Produces `generateCount` CANDIDATES (>= what we deliver),
   * then scores them for identity fidelity and delivers only the best
   * `deliverN`. Overgenerating + culling insures against the occasional
   * off-identity seed (gender flip / beard drop) without retraining -- those
   * seeds score low against the real selfies and are dropped automatically.
   *
   * One prediction per candidate SLOT, index-aligned with `resultImageUrls`.
   * Candidates cycle the prompt list (prompts[i % prompts.length]), so when
   * generateCount > prompts.length some styles get an extra variant on a fresh
   * seed. Idempotent + resumable per slot, in two passes, EXACTLY as before:
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
   *
   * Once ALL candidates are in, selectAndDeliver() scores + picks the delivered
   * set. The transition to DELIVERED happens only after deliveredImageUrls is
   * persisted, so DELIVERED always implies a chosen set exists.
   */
  async function runGenerationStage(orderId, order) {
    const modelVersion = order.replicate?.trainedModelVersion;
    if (!modelVersion) {
      throw new Error(`[worker] order ${orderId} is GENERATING without a trained model version`);
    }

    // SELECTION receipt-before-acting: if we already scored, chose, and persisted
    // the delivered set, a restart re-entering GENERATING must NOT re-score or
    // re-select (same guard shape as deliveredEmailSentAt / refundedAt). Just
    // advance. All candidates are necessarily present if deliveredImageUrls is.
    if (order.deliveredImageUrls?.length) {
      await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
      return;
    }

    const generationIds = [...(order.replicate?.generationIds ?? [])];
    const resultImageUrls = [...(order.resultImageUrls ?? [])];

    // Build THIS order's prompts from its selected looks/attire (shared catalog).
    // One prompt per candidate slot; if the list is shorter than generateCount the
    // slots cycle through it (prompts[i % prompts.length]).
    const prompts = buildPrompts(order);

    // Pass 1: ensure every candidate slot has a started prediction, persisting
    // each id BEFORE any polling so a crash reattaches instead of regenerating.
    // Slots that already carry an id are skipped -> never double-started.
    for (let i = 0; i < generateCount; i++) {
      if (generationIds[i]) continue;
      const prompt = prompts[i % prompts.length];
      const { predictionId } = await client.startGeneration(modelVersion, prompt);
      generationIds[i] = predictionId;
      // Persist the WHOLE array, not a positional `generationIds.i` path: a
      // dotted numeric $set on a not-yet-existing field creates an OBJECT
      // ({"0": id}) on real MongoDB, which then reads back so the reattach guard
      // cannot see it and the slot gets started again (a double-run). Writing the
      // array outright keeps it an array. Still persisted BEFORE polling.
      await Order.updateOne({ _id: orderId }, { $set: { 'replicate.generationIds': generationIds } });
      console.log(`[worker] order ${orderId} candidate ${i} started: ${predictionId}`);
    }

    // Pass 2: collect each still-missing image by REATTACHING to its existing
    // predictionId. Never starts a generation here. Persists per slot so finished
    // work survives a crash and is never re-collected (nor its cost double-counted).
    for (let i = 0; i < generateCount; i++) {
      if (resultImageUrls[i]) continue;
      const predictionId = generationIds[i];
      // Invariant: pass 1 guarantees every slot has an id before we poll.
      if (!predictionId) {
        throw new Error(`[worker] order ${orderId} candidate slot ${i} has no predictionId to reattach`);
      }
      const result = await pollUntilSettled(() => client.pollGeneration(predictionId), {
        maxWaitMs: generationMaxWaitMs,
        label: `generation ${predictionId}`,
      });
      if (result.status !== 'succeeded' || !result.imageUrl) {
        throw new Error(`[worker] generation ${predictionId} failed for order ${orderId}`);
      }
      resultImageUrls[i] = result.imageUrl;
      // Whole array, not a positional path, for the same reason as generationIds:
      // avoid a dotted numeric $set turning the field into an object.
      await Order.updateOne(
        { _id: orderId },
        {
          $set: { resultImageUrls },
          $inc: { computeCostCents: usdToCents(result.costUsd) },
        }
      );
      console.log(`[worker] order ${orderId} candidate ${i} done (${i + 1}/${generateCount})`);
    }

    // All candidates are in. Score + choose the delivered set, then transition.
    await selectAndDeliver(orderId, order, resultImageUrls);

    await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
  }

  /**
   * SELECTION step. Score every candidate for identity fidelity against the
   * order's real uploaded selfies, then persist the top `deliverN` as
   * deliveredImageUrls. Idempotent + deterministic + resumable:
   *
   *   - Scoring is per-candidate and persisted incrementally (candidateScores,
   *     index-aligned with resultImageUrls), so a crash mid-scoring re-scores
   *     ONLY the candidates without a score yet -- never re-scoring a done one,
   *     never double-charging its scoring call. Same per-slot pattern as Pass 2.
   *   - Ranking is deterministic: sort by score descending, breaking ties by
   *     candidate index ascending, so the SAME candidates win on every run given
   *     the same scores. (If there are no references, every score is neutral and
   *     the tie-break degrades selection to "the first deliverN candidates".)
   *   - deliveredImageUrls is the idempotency anchor: the caller's top guard
   *     skips this whole step once it is set, so re-selection cannot happen.
   *
   * Cost note: this raises per-order compute cost -- we now pay for
   * generateCount generations (more than we ship) PLUS one scoring pass -- a
   * deliberate quality/refund tradeoff: culling a bad seed before delivery is
   * far cheaper than a refund or a retrain.
   */
  async function selectAndDeliver(orderId, order, resultImageUrls) {
    const references = order.uploadedImageUrls ?? [];
    const scores = [...(order.candidateScores ?? [])];

    for (let i = 0; i < resultImageUrls.length; i++) {
      if (scores[i]) continue; // already scored this candidate -> never re-score
      const { score, costUsd } = await scoreIdentity(resultImageUrls[i], references);
      scores[i] = { imageUrl: resultImageUrls[i], score };
      // Whole array (not a positional path) for the same object-vs-array reason
      // as generationIds/resultImageUrls. Persisted before the next score so a
      // crash resumes at the first unscored candidate and its cost lands once.
      await Order.updateOne(
        { _id: orderId },
        {
          $set: { candidateScores: scores },
          $inc: { computeCostCents: usdToCents(costUsd) },
        }
      );
      console.log(
        `[worker] order ${orderId} candidate ${i} identity score ${score.toFixed(4)}`
      );
    }

    // Deterministic rank: best score first, candidate index as the tie-break.
    const selectedUrls = scores
      .map((s, i) => ({ i, url: s.imageUrl, score: s.score }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, deliverN)
      .map((c) => c.url);

    // Optional IDENTITY LOCK: swap the customer's real face onto each selected
    // headshot, so the delivered face carries their true geometry/hair/expression
    // instead of the LoRA's drift (long face, wrong hair, invented smile). Resumable
    // like scoring: swappedImageUrls is persisted per slot, index-aligned with
    // selectedUrls (a deterministic, stable order), so a crash resumes at the first
    // un-swapped slot and never re-pays for a done one. When swapping is OFF
    // (no swapFace injected) we deliver the selected set unchanged.
    let deliveredImageUrls = selectedUrls;
    const source = (order.uploadedImageUrls ?? [])[0];
    if (swapFace && selectedUrls.length > 0 && source) {
      const swapped = [...(order.swappedImageUrls ?? [])];
      for (let i = 0; i < selectedUrls.length; i++) {
        if (swapped[i]) continue; // already swapped this slot -> never redo
        const { imageUrl, costUsd } = await swapFace(selectedUrls[i], source);
        swapped[i] = imageUrl;
        await Order.updateOne(
          { _id: orderId },
          { $set: { swappedImageUrls: swapped }, $inc: { computeCostCents: usdToCents(costUsd) } }
        );
        console.log(`[worker] order ${orderId} face-swapped ${i + 1}/${selectedUrls.length}`);
      }
      deliveredImageUrls = swapped;
    }

    // FINAL realism polish: enhance each delivered image (skin texture + sharper
    // eyes, without re-generating so identity holds). Resumable per slot, aligned
    // with the current deliveredImageUrls (selected or swapped). Off when no
    // enhancer is injected.
    if (enhanceFace && deliveredImageUrls.length > 0) {
      const enhanced = [...(order.enhancedImageUrls ?? [])];
      for (let i = 0; i < deliveredImageUrls.length; i++) {
        if (enhanced[i]) continue;
        const { imageUrl, costUsd } = await enhanceFace(deliveredImageUrls[i]);
        enhanced[i] = imageUrl;
        await Order.updateOne(
          { _id: orderId },
          { $set: { enhancedImageUrls: enhanced }, $inc: { computeCostCents: usdToCents(costUsd) } }
        );
        console.log(`[worker] order ${orderId} enhanced ${i + 1}/${deliveredImageUrls.length}`);
      }
      deliveredImageUrls = enhanced;
    }

    // DURABILITY: copy the final delivered set off the ephemeral upstream host
    // (replicate.delivery garbage-collects prediction outputs within ~an hour) into
    // our own R2 bucket, so the results page, download endpoints, and delivery-email
    // link never 404. Resumable per slot via persistedImageUrls (same shape as
    // swapped/enhanced), keyed deterministically as deliveries/<orderId>/<i> so a
    // retry overwrites the same object. Off (deliver the upstream URLs unchanged)
    // when no persister is injected, keeping the fake path and legacy behaviour intact.
    if (persistImage && deliveredImageUrls.length > 0) {
      const persisted = [...(order.persistedImageUrls ?? [])];
      for (let i = 0; i < deliveredImageUrls.length; i++) {
        if (persisted[i]) continue; // already copied this slot -> never redo
        const { imageUrl } = await persistImage(deliveredImageUrls[i], `deliveries/${orderId}/${i}`);
        persisted[i] = imageUrl;
        await Order.updateOne({ _id: orderId }, { $set: { persistedImageUrls: persisted } });
        console.log(`[worker] order ${orderId} persisted ${i + 1}/${deliveredImageUrls.length} to R2`);
      }
      deliveredImageUrls = persisted;
    }

    await Order.updateOne({ _id: orderId }, { $set: { deliveredImageUrls } });
    console.log(
      `[worker] order ${orderId} selected ${deliveredImageUrls.length}/${resultImageUrls.length} candidates for delivery`
    );
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
          // The webhook enqueues a PAID order after payment (the order already has
          // its selections + images). Nothing external here; move into training.
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

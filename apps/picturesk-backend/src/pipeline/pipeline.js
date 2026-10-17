import { Order, ORDER_STATES, transitionOrder } from '@travel-suite/picturesk-shared';


const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const usdToCents = (usd) => Math.round((usd || 0) * 100);

export const DEFAULT_POLL_INTERVAL_MS = 8000;
export const DEFAULT_TRAINING_MAX_WAIT_MS = 30 * 60 * 1000; 
export const DEFAULT_GENERATION_MAX_WAIT_MS = 6 * 60 * 1000; 
export const DEFAULT_TRAINING_STARTING_MAX_MS = 45 * 60 * 1000; 
export const DEFAULT_MAX_TRAINING_RESTARTS = 1;



async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const size = Math.max(1, Math.min(limit, items.length));
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

export function createPipeline({
  client,
  buildPrompts,
  scoreIdentity = async () => ({ score: 0, costUsd: 0 }),
  swapFace,
  enhanceFace,
  persistImage,
  persistWeights,
  generateCount = 14,
  deliverCount = 14,
  scoreConcurrency = 6,
  cullingEnabled = false,
  overgenerateFactor = 1.5,
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
  const deliverCountFor = (order) => order?.deliverCount ?? deliverCount;

  const genCountFor = (order) =>
    cullingEnabled
      ? Math.ceil(deliverCountFor(order) * overgenerateFactor)
      : (order?.generateCount ?? generateCount);

  const deliverNFor = (order) => Math.min(deliverCountFor(order), genCountFor(order));
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

  async function runTrainingStage(orderId, order) {
    if (order.replicate?.trainedModelVersion) {
      await transitionOrder(orderId, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING);
      return;
    }

    let trainingId = order.replicate?.trainingId;

    if (!trainingId) {
      const zipUrl = resolveTrainingZip ? await resolveTrainingZip(order) : imageZipUrl;
      if (!zipUrl) {
        throw new Error(`[worker] order ${orderId} has no training images to train on`);
      }
      const started = await client.startTraining(zipUrl);
      trainingId = started.trainingId;
      await Order.updateOne({ _id: orderId }, { $set: { 'replicate.trainingId': trainingId } });
      console.log(`[worker] order ${orderId} training started: ${trainingId}`);
    } else {
      console.log(`[worker] order ${orderId} reattaching to training ${trainingId}`);
    }

    const allocationDeadline = Date.now() + startingMaxWaitMs;
    let runningSince = null;
    let result;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      result = await client.pollTraining(trainingId);
      if (result.status === 'succeeded') break;
      if (result.status === 'failed') {
        throw new Error(`[worker] training ${trainingId} failed for order ${orderId}`);
      }
      const running = result.allocated !== false;
      if (running) {
        if (runningSince === null) runningSince = Date.now();
        if (Date.now() - runningSince > trainingMaxWaitMs) {
          throw new Error(`[worker] training ${trainingId} did not finish within ${trainingMaxWaitMs}ms of starting`);
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

    await Order.updateOne(
      { _id: orderId },
      {
        $set: { 'replicate.trainedModelVersion': result.trainedModelVersion },
        $inc: { computeCostCents: usdToCents(result.costUsd) },
      }
    );
    console.log(`[worker] order ${orderId} trained: ${result.trainedModelVersion}`);

    if (persistWeights && result.weightsUrl) {
      try {
        const { weightsUrl } = await persistWeights(result.weightsUrl, `models/${orderId}`);
        await Order.updateOne({ _id: orderId }, { $set: { 'replicate.weightsUrl': weightsUrl } });
      } catch (err) {
        console.warn(`[worker] order ${orderId}: weights backup failed (${err.message})`);
      }
    }

    await transitionOrder(orderId, ORDER_STATES.TRAINING, ORDER_STATES.GENERATING);
  }

  async function runGenerationStage(orderId, order) {
    const modelVersion = order.replicate?.trainedModelVersion;
    if (!modelVersion) {
      throw new Error(`[worker] order ${orderId} is GENERATING without a trained model version`);
    }

    if (order.deliveredImageUrls?.length) {
      await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
      return;
    }

    const generationIds = [...(order.replicate?.generationIds ?? [])];
    const resultImageUrls = [...(order.resultImageUrls ?? [])];

    const genCount = genCountFor(order);

    const prompts = buildPrompts(order, genCount);

    for (let i = 0; i < genCount; i++) {
      if (generationIds[i]) continue;
      const prompt = prompts[i % prompts.length];
      const { predictionId } = await client.startGeneration(modelVersion, prompt);
      generationIds[i] = predictionId;
      await Order.updateOne({ _id: orderId }, { $set: { 'replicate.generationIds': generationIds } });
      console.log(`[worker] order ${orderId} candidate ${i} started: ${predictionId}`);
    }

    for (let i = 0; i < genCount; i++) {
      if (resultImageUrls[i]) continue;
      const predictionId = generationIds[i];
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
      await Order.updateOne(
        { _id: orderId },
        {
          $set: { resultImageUrls },
          $inc: { computeCostCents: usdToCents(result.costUsd) },
        }
      );
      console.log(`[worker] order ${orderId} candidate ${i} done (${i + 1}/${genCount})`);
    }

    await selectAndDeliver(orderId, order, resultImageUrls);

    await transitionOrder(orderId, ORDER_STATES.GENERATING, ORDER_STATES.DELIVERED);
  }

  async function selectAndDeliver(orderId, order, resultImageUrls) {
    const references = order.uploadedImageUrls ?? [];
    const scores = [...(order.candidateScores ?? [])];
    const deliverN = deliverNFor(order);

    const todo = [];
    for (let i = 0; i < resultImageUrls.length; i++) {
      if (!scores[i]) todo.push(i);
    }

    if (todo.length) {
      let costAccum = 0;
      const scoreOne = async (i) => {
        const { score, costUsd } = await scoreIdentity(resultImageUrls[i], references);
        scores[i] = { imageUrl: resultImageUrls[i], score };
        costAccum += costUsd ?? 0;
      };

      await scoreOne(todo[0]);
      await mapWithLimit(todo.slice(1), scoreConcurrency, scoreOne);

      await Order.updateOne(
        { _id: orderId },
        {
          $set: { candidateScores: scores },
          $inc: { computeCostCents: usdToCents(costAccum) },
        }
      );
      console.log(
        `[worker] order ${orderId} scored ${todo.length} candidate${
          todo.length === 1 ? '' : 's'
        } (concurrency ${scoreConcurrency})`
      );
    }

    const selectedUrls = scores
      .map((s, i) => ({ i, url: s.imageUrl, score: s.score }))
      .sort((a, b) => b.score - a.score || a.i - b.i)
      .slice(0, deliverN)
      .map((c) => c.url);

    let deliveredImageUrls = selectedUrls;
    const source = (order.uploadedImageUrls ?? [])[0];
    if (swapFace && selectedUrls.length > 0 && source) {
      const swapped = [...(order.swappedImageUrls ?? [])];
      for (let i = 0; i < selectedUrls.length; i++) {
        if (swapped[i]) continue; 
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

    if (persistImage && deliveredImageUrls.length > 0) {
      const persisted = [...(order.persistedImageUrls ?? [])];
      for (let i = 0; i < deliveredImageUrls.length; i++) {
        if (persisted[i]) continue; 
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

  async function processOrder(orderId) {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const order = await Order.findById(orderId);
      if (!order) throw new Error(`order ${orderId} not found`);

      switch (order.status) {
        case ORDER_STATES.PAID:
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
          if (onDelivered) await onDelivered(orderId);
          console.log(`[worker] order ${orderId} DELIVERED`);
          return;

        case ORDER_STATES.FAILED:
          // idempotent failure side effect (refund) and stop. Its refundedAt
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

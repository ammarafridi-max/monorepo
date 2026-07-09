import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Order, ORDER_STATES, buildPrompts } from '@headliner/shared';
import { createPipeline } from '../pipeline.js';
import { createEnsureRefund } from '../refund.js';
import * as fake from '../replicateClient.fake.js';

// Sample selections so the harness builds prompts the SAME way production does:
// through the shared catalog buildPrompts, from an order's selected looks/attire.
const SAMPLE_LOOKS = ['corporate_studio', 'outdoor_professional'];
const SAMPLE_ATTIRE = ['business_suit', 'smart_knit'];
const SUBJECT_ANCHOR = 'HDLNRZ, a person';

/**
 * Phase 3 hardening: prove the worker's crash-reattach + per-slot idempotency
 * against the fake Replicate client on an ephemeral Mongo. A "crash" is the fake
 * throwing mid-flight so processOrder rejects; a "restart" is simply calling
 * processOrder again on the same order. Real Replicate ids/state persist to Mongo
 * before polling, so the restart must reattach, never re-run.
 */

let mongod;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await Order.deleteMany({});
});

// Fast poll timings so scripted 'processing' statuses don't slow the tests.
// Prompts come from the SHARED catalog buildPrompts (the production source of
// truth), built from each order's selections (falling back to sample selections).
// generateCount drives how many candidate prompts are produced.
function buildPipeline(extra = {}) {
  const generateCount = extra.generateCount ?? 14;
  const deliverCount = extra.deliverCount ?? generateCount;
  return createPipeline({
    client: fake,
    buildPrompts: (order) =>
      buildPrompts({
        looks: order.selectedLooks ?? SAMPLE_LOOKS,
        attire: order.selectedAttire ?? SAMPLE_ATTIRE,
        count: generateCount,
        subjectAnchor: SUBJECT_ANCHOR,
      }),
    generateCount,
    deliverCount,
    // A neutral default scorer; selection-focused tests inject their own.
    scoreIdentity: extra.scoreIdentity ?? makeScorer(),
    imageZipUrl: 'https://fake.local/selfies.zip',
    pollIntervalMs: 1,
    trainingMaxWaitMs: 60_000,
    generationMaxWaitMs: 60_000,
    ...extra,
  });
}

const nonNull = (arr) => (arr ?? []).filter((v) => v != null);

// The fake generation URLs are `https://fake.local/img/pred_<N>.jpg`; N is the
// prediction sequence, so a lower N == an earlier-started candidate slot.
const predNum = (url) => Number(String(url).match(/pred_(\d+)/)?.[1]);

// A stubbed identity scorer, same { score, costUsd } contract as scoreIdentity.
// Counts its calls (so tests can prove one-score-per-candidate + no re-scoring)
// and can fire a one-shot crash on the Nth call to simulate a crash mid-selection.
function makeScorer({ scoreFor = () => 0.5, crashOnCall } = {}) {
  const calls = [];
  let armed = crashOnCall;
  const scorer = async (candidateImageUrl) => {
    calls.push(candidateImageUrl);
    if (armed && calls.length === armed) {
      armed = null; // fire once; a restart past this point scores normally
      throw new Error(`SIMULATED_SCORE_CRASH at call ${calls.length}`);
    }
    return { score: scoreFor(candidateImageUrl), costUsd: 0.005 };
  };
  scorer.calls = calls;
  scorer.callCount = () => calls.length;
  return scorer;
}

// A counting stub of the Stripe refund API, shaped like the real client
// (stripe.refunds.create(params, { idempotencyKey })). It records call count and
// the idempotency keys it saw, the same way the fake Replicate client counts
// startGeneration. No network, no money.
function makeFakeStripe() {
  const idempotencyKeys = [];
  return {
    idempotencyKeys,
    refundCount: () => idempotencyKeys.length,
    refunds: {
      create: async (_params, opts) => {
        idempotencyKeys.push(opts?.idempotencyKey);
        return { id: `re_${idempotencyKeys.length}` };
      },
    },
  };
}

test('scenario 1: crash after trainingId persisted, before success -> reattaches, startTraining called exactly once', async () => {
  // Training reports 'processing' then 'succeeded', but the FIRST poll crashes.
  fake.resetFake({
    trainingStatusSeq: ['processing', 'succeeded'],
    crashOn: { pollTraining: 1 },
  });

  // The worker enters at TRAINING (enqueued by the image-submit endpoint after it
  // moved AWAITING_UPLOAD -> TRAINING). Selections drive prompt building later.
  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline();

  // Run 1: startTraining, persist trainingId, then the first training poll
  // crashes (before it ever reports success).
  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(mid.status, ORDER_STATES.TRAINING, 'still in TRAINING after crash');
  assert.ok(mid.replicate?.trainingId, 'trainingId was persisted before the crash');
  assert.equal(mid.replicate?.trainedModelVersion, undefined, 'not trained yet');
  assert.equal(fake.getCounts().startTraining, 1, 'started training once');

  const trainingIdBefore = mid.replicate.trainingId;

  // Run 2 (restart): must REATTACH to the same training, not start a new one.
  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'order completes after restart');
  assert.equal(fake.getCounts().startTraining, 1, 'NEVER retrained (still exactly 1)');
  assert.equal(done.replicate.trainingId, trainingIdBefore, 'same training reattached');
});

test('scenario 2: crash after trainedModelVersion persisted -> restart skips training, goes straight to generating', async () => {
  fake.resetFake();

  // Simulate the post-crash state: training already produced a version, but the
  // order never advanced past TRAINING.
  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();
  const pipeline = buildPipeline();

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(fake.getCounts().startTraining, 0, 'training entirely skipped');
  assert.equal(fake.getCounts().pollTraining, 0, 'training never even polled');
  assert.ok(fake.getCounts().startGeneration >= 1, 'went straight into generating');
});

test('scenario 3: crash mid-generation with 3/GENERATE_COUNT candidates done -> only missing reattach, startGeneration total == GENERATE_COUNT, then selection delivers DELIVER_COUNT', async () => {
  // Each generation succeeds on its first poll; crash on the 4th generation poll,
  // i.e. after 3 candidates have been collected.
  fake.resetFake({
    generationStatusSeq: ['succeeded'],
    crashOn: { pollGeneration: 4 },
  });

  const GENERATE_COUNT = 10;
  const DELIVER_COUNT = 7;
  // 10 candidates but only 4 selected look x attire combinations: proves the
  // candidate slots cycle the buildPrompts output.
  // Lower pred number -> higher score, so the winning set is deterministic.
  const scorer = makeScorer({ scoreFor: (url) => 1 - predNum(url) / 100 });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    scoreIdentity: scorer,
  });

  // Run 1: all GENERATE_COUNT predictions get STARTED (ids persisted), 3
  // collected, then the 4th poll crashes -- before any scoring/selection.
  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'all candidate slots started exactly once');
  const idsAfterCrash = [...mid.replicate.generationIds];
  assert.equal(idsAfterCrash.filter(Boolean).length, GENERATE_COUNT, 'all predictionIds persisted');
  assert.equal(nonNull(mid.resultImageUrls).length, 3, 'exactly 3 candidates collected before crash');
  assert.equal(nonNull(mid.candidateScores).length, 0, 'no scoring until every candidate is in');
  assert.equal(mid.deliveredImageUrls?.length ?? 0, 0, 'nothing delivered yet');
  assert.equal(scorer.callCount(), 0, 'scorer not called before all candidates collected');

  // Run 2 (restart): the missing candidates must REATTACH to their existing
  // predictionIds; no new generation is started. Then selection runs.
  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'order completes after restart');
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'startGeneration total never exceeds GENERATE_COUNT');
  assert.deepEqual(
    [...done.replicate.generationIds],
    idsAfterCrash,
    'same predictionIds reused (reattached, not regenerated)'
  );
  assert.equal(nonNull(done.resultImageUrls).length, GENERATE_COUNT, 'all candidates collected');
  assert.equal(done.candidateScores.length, GENERATE_COUNT, 'every candidate scored');
  assert.equal(scorer.callCount(), GENERATE_COUNT, 'scorer called exactly once per candidate');
  assert.equal(done.deliveredImageUrls.length, DELIVER_COUNT, 'delivered exactly DELIVER_COUNT');

  // Deterministic cull: the DELIVER_COUNT highest-scoring candidates win.
  const expected = [...done.candidateScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, DELIVER_COUNT)
    .map((s) => s.imageUrl);
  assert.deepEqual(done.deliveredImageUrls, expected, 'delivered set is the top DELIVER_COUNT by score');

  // Regression guard: these MUST persist as real arrays. A positional dotted
  // $set (replicate.generationIds.i) creates an object {"0": ...} on real
  // MongoDB, which breaks the reattach guard and re-creates predictions.
  const raw = await Order.findById(id).lean();
  assert.ok(Array.isArray(raw.replicate.generationIds), 'generationIds is an array, not an object');
  assert.ok(Array.isArray(raw.resultImageUrls), 'resultImageUrls is an array, not an object');
  assert.ok(Array.isArray(raw.candidateScores), 'candidateScores is an array, not an object');
  assert.ok(Array.isArray(raw.deliveredImageUrls), 'deliveredImageUrls is an array, not an object');
});

test('scenario 5: crash after all candidates generated but BEFORE selection -> restart runs selection once, deliveredImageUrls = top DELIVER_COUNT by the stubbed scorer', async () => {
  fake.resetFake({ generationStatusSeq: ['succeeded'] });

  const GENERATE_COUNT = 6;
  const DELIVER_COUNT = 3;
  // Crash on the FIRST identity score: all candidates are already generated, but
  // no selection has been persisted -> the "candidates in, selection not done" gap.
  const scorer = makeScorer({ scoreFor: (url) => 1 - predNum(url) / 100, crashOnCall: 1 });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    scoreIdentity: scorer,
  });

  // Run 1: every candidate generated + collected, then the first score crashes.
  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_SCORE_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(mid.status, ORDER_STATES.GENERATING, 'still GENERATING: selection did not finish');
  assert.equal(nonNull(mid.resultImageUrls).length, GENERATE_COUNT, 'all candidates generated before the crash');
  assert.equal(nonNull(mid.candidateScores).length, 0, 'no score persisted (crashed on the first score)');
  assert.equal(mid.deliveredImageUrls?.length ?? 0, 0, 'nothing delivered yet');
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'candidates generated exactly once');

  // Run 2 (restart): selection runs to completion exactly once.
  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'delivered after restart');
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'candidates never regenerated during selection retry');
  assert.equal(done.candidateScores.length, GENERATE_COUNT, 'every candidate scored');
  // The crashed first score is retried; the other candidates score once each.
  assert.equal(scorer.callCount(), GENERATE_COUNT + 1, 'only the crashed candidate was re-scored');
  assert.equal(done.deliveredImageUrls.length, DELIVER_COUNT, 'delivered exactly DELIVER_COUNT');

  const expected = [...done.candidateScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, DELIVER_COUNT)
    .map((s) => s.imageUrl);
  assert.deepEqual(done.deliveredImageUrls, expected, 'chosen set is the top DELIVER_COUNT by score');
});

test('scenario 6: crash after selection persisted but BEFORE the DELIVERED transition -> restart transitions without re-scoring or re-selecting', async () => {
  fake.resetFake();
  // This scorer must NEVER be called: deliveredImageUrls is already set.
  const scorer = makeScorer();

  const GENERATE_COUNT = 6;
  const DELIVER_COUNT = 3;
  // Reconstruct the exact post-crash state: candidates generated + collected,
  // scored, and the delivered set persisted, but the order never advanced past
  // GENERATING (the transition is the very next step after persisting delivery).
  const resultImageUrls = Array.from(
    { length: GENERATE_COUNT },
    (_, i) => `https://fake.local/img/pred_${i + 1}.jpg`
  );
  const candidateScores = resultImageUrls.map((url, i) => ({ imageUrl: url, score: 1 - i / 100 }));
  const deliveredImageUrls = candidateScores.slice(0, DELIVER_COUNT).map((s) => s.imageUrl);

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    replicate: {
      trainingId: 'train_pre',
      trainedModelVersion: 'fakeowner/fakemodel:v1',
      generationIds: resultImageUrls.map((_, i) => `pred_${i + 1}`),
    },
    resultImageUrls,
    candidateScores,
    deliveredImageUrls,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    scoreIdentity: scorer,
  });

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'transitioned to DELIVERED on restart');
  assert.equal(scorer.callCount(), 0, 'never re-scored');
  assert.equal(fake.getCounts().startGeneration, 0, 'never re-generated');
  assert.deepEqual(done.deliveredImageUrls, deliveredImageUrls, 'delivered set unchanged (no re-selection)');
  assert.deepEqual(
    done.candidateScores.map((s) => s.imageUrl),
    candidateScores.map((s) => s.imageUrl),
    'candidate scores unchanged'
  );
});

test('scenario 4: training fails -> FAILED with error recorded, refund issued exactly once, and re-entering FAILED never refunds again', async () => {
  // Training reports 'failed' on its first (and only) poll.
  fake.resetFake({ trainingStatusSeq: ['failed'] });

  const stripe = makeFakeStripe();
  const ensureRefund = createEnsureRefund({ stripe });

  // Enters at TRAINING (post-upload). The customer actually paid: a payment intent
  // exists, so a failure is refundable.
  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    stripePaymentIntentId: 'pi_test_123',
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({ onFailed: ensureRefund });

  // Phase 1: startTraining, then the training poll returns 'failed' so
  // processOrder rejects (this is what BullMQ sees as a job failure).
  let thrown;
  await assert.rejects(
    () => pipeline.processOrder(id),
    (err) => ((thrown = err), /training .* failed/.test(err.message))
  );

  const midStatus = await Order.findById(id);
  assert.equal(midStatus.status, ORDER_STATES.TRAINING, 'still TRAINING at the point of failure');

  // The worker's failure handler runs once retries are exhausted: it moves the
  // order to FAILED (recording the error) and issues the refund.
  await pipeline.failOrder(id, thrown);

  const failed = await Order.findById(id);
  assert.equal(failed.status, ORDER_STATES.FAILED, 'order reached FAILED');
  assert.ok(failed.error, 'error was recorded');
  assert.equal(failed.error.stage, ORDER_STATES.TRAINING, 'error.stage is where it failed');
  assert.match(failed.error.message, /failed/, 'error.message recorded');
  assert.ok(failed.error.at instanceof Date, 'error.at timestamp recorded');
  assert.ok(failed.refundedAt, 'refundedAt stamped on successful refund');
  assert.equal(stripe.refundCount(), 1, 'refund issued exactly once');
  assert.equal(stripe.idempotencyKeys[0], `refund:${id}`, 'refund used the per-order idempotency key');

  // Phase 2: a restart re-enters FAILED, both via re-processing the job and via a
  // re-fire of the failure handler. refundedAt is already set, so the guard must
  // stop a second Stripe refund.
  await pipeline.processOrder(id); // FAILED case -> onFailed -> refundedAt set -> no-op
  await pipeline.failOrder(id, thrown); // already FAILED -> ensureRefund -> no-op

  const afterRestart = await Order.findById(id);
  assert.equal(afterRestart.status, ORDER_STATES.FAILED, 'still FAILED after restart');
  assert.equal(stripe.refundCount(), 1, 'refund count is STILL exactly 1, never refunded twice');
});

test('cost invariant: with identity culling OFF, generate == deliver (never pay for extra images)', async () => {
  fake.resetFake({ generationStatusSeq: ['succeeded'] });

  // Identity culling is OFF when REPLICATE_FACE_EMBED_MODEL is unset. In that case
  // apps/worker/index.js pins GENERATE_COUNT to DELIVER_COUNT and injects NO scorer
  // (the pipeline falls back to its neutral default). Reproduce that exact wiring:
  // equal counts + no scorer, at the new default count (14), with prompts built
  // from real selections via the shared catalog. The invariant we lock: the
  // GENERATING stage generates exactly what it delivers, so we never pay to
  // generate images we then discard.
  const DELIVER_COUNT = 14; // index.js default when unset
  const GENERATE_COUNT = DELIVER_COUNT; // culling off pins generate to deliver
  assert.equal(GENERATE_COUNT, DELIVER_COUNT, 'premise: culling off means generate == deliver');

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();

  // Built directly (not via buildPipeline, which always injects a stub scorer) so
  // NO scorer is passed and the pipeline uses its neutral default -- the real
  // culling-off path. Prompts come from the shared catalog buildPrompts.
  const pipeline = createPipeline({
    client: fake,
    buildPrompts: (o) =>
      buildPrompts({
        looks: o.selectedLooks,
        attire: o.selectedAttire,
        count: GENERATE_COUNT,
        subjectAnchor: SUBJECT_ANCHOR,
      }),
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    imageZipUrl: 'https://fake.local/selfies.zip',
    pollIntervalMs: 1,
    trainingMaxWaitMs: 60_000,
    generationMaxWaitMs: 60_000,
  });

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'order delivered');

  // THE COST INVARIANT: images generated == images delivered.
  assert.equal(
    fake.getCounts().startGeneration,
    done.deliveredImageUrls.length,
    'startGeneration count == deliveredImageUrls.length (generate exactly what we deliver)'
  );
  // And that is exactly the target count: nothing overgenerated, nothing dropped.
  assert.equal(fake.getCounts().startGeneration, DELIVER_COUNT, 'generated exactly DELIVER_COUNT (14)');
  assert.equal(done.deliveredImageUrls.length, DELIVER_COUNT, 'delivered exactly DELIVER_COUNT (14)');
});

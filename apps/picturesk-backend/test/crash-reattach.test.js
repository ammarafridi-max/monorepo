import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Order, ORDER_STATES, buildPrompts } from '@travel-suite/picturesk-shared';
import { createPipeline } from '../src/pipeline/pipeline.js';
import { createEnsureRefund } from '../src/pipeline/refund.js';
import * as fake from '../src/pipeline/replicateClient.fake.js';

const SAMPLE_LOOKS = ['corporate_studio', 'outdoor_professional'];
const SAMPLE_ATTIRE = ['business_suit', 'smart_knit'];
const SUBJECT_ANCHOR = 'HDLNRZ, a person';


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

function buildPipeline(extra = {}) {
  const generateCount = extra.generateCount ?? 14;
  const deliverCount = extra.deliverCount ?? generateCount;
  return createPipeline({
    client: fake,
    buildPrompts: (order, count) =>
      buildPrompts({
        looks: order.selectedLooks ?? SAMPLE_LOOKS,
        attire: order.selectedAttire ?? SAMPLE_ATTIRE,
        count: count ?? generateCount,
        subjectAnchor: SUBJECT_ANCHOR,
      }),
    generateCount,
    deliverCount,
    scoreIdentity: extra.scoreIdentity ?? makeScorer(),
    imageZipUrl: 'https://fake.local/selfies.zip',
    pollIntervalMs: 1,
    trainingMaxWaitMs: 60_000,
    generationMaxWaitMs: 60_000,
    ...extra,
  });
}

const nonNull = (arr) => (arr ?? []).filter((v) => v != null);

const predNum = (url) => Number(String(url).match(/pred_(\d+)/)?.[1]);

function makeScorer({ scoreFor = () => 0.5, crashOnCall } = {}) {
  const calls = [];
  let armed = crashOnCall;
  const scorer = async (candidateImageUrl) => {
    calls.push(candidateImageUrl);
    if (armed && calls.length === armed) {
      armed = null; 
      throw new Error(`SIMULATED_SCORE_CRASH at call ${calls.length}`);
    }
    return { score: scoreFor(candidateImageUrl), costUsd: 0.005 };
  };
  scorer.calls = calls;
  scorer.callCount = () => calls.length;
  return scorer;
}

function makePersister({ crashOnCall } = {}) {
  const calls = [];
  let armed = crashOnCall;
  const persist = async (sourceUrl, keyBase) => {
    calls.push({ sourceUrl, keyBase });
    if (armed && calls.length === armed) {
      armed = null; 
      throw new Error(`SIMULATED_PERSIST_CRASH at call ${calls.length}`);
    }
    return { imageUrl: `https://r2.local/${keyBase}.jpg` };
  };
  persist.calls = calls;
  persist.callCount = () => calls.length;
  return persist;
}

// (stripe.refunds.create(params, { idempotencyKey })). It records call count and
// the idempotency keys it saw, the same way the fake Replicate client counts
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
  fake.resetFake({
    trainingStatusSeq: ['processing', 'succeeded'],
    crashOn: { pollTraining: 1 },
  });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline();

  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(mid.status, ORDER_STATES.TRAINING, 'still in TRAINING after crash');
  assert.ok(mid.replicate?.trainingId, 'trainingId was persisted before the crash');
  assert.equal(mid.replicate?.trainedModelVersion, undefined, 'not trained yet');
  assert.equal(fake.getCounts().startTraining, 1, 'started training once');

  const trainingIdBefore = mid.replicate.trainingId;

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'order completes after restart');
  assert.equal(fake.getCounts().startTraining, 1, 'NEVER retrained (still exactly 1)');
  assert.equal(done.replicate.trainingId, trainingIdBefore, 'same training reattached');
});

test('scenario 2: crash after trainedModelVersion persisted -> restart skips training, goes straight to generating', async () => {
  fake.resetFake();

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
  fake.resetFake({
    generationStatusSeq: ['succeeded'],
    crashOn: { pollGeneration: 4 },
  });

  const GENERATE_COUNT = 10;
  const DELIVER_COUNT = 7;
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

  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'all candidate slots started exactly once');
  const idsAfterCrash = [...mid.replicate.generationIds];
  assert.equal(idsAfterCrash.filter(Boolean).length, GENERATE_COUNT, 'all predictionIds persisted');
  assert.equal(nonNull(mid.resultImageUrls).length, 3, 'exactly 3 candidates collected before crash');
  assert.equal(nonNull(mid.candidateScores).length, 0, 'no scoring until every candidate is in');
  assert.equal(mid.deliveredImageUrls?.length ?? 0, 0, 'nothing delivered yet');
  assert.equal(scorer.callCount(), 0, 'scorer not called before all candidates collected');

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

  const expected = [...done.candidateScores]
    .sort((a, b) => b.score - a.score)
    .slice(0, DELIVER_COUNT)
    .map((s) => s.imageUrl);
  assert.deepEqual(done.deliveredImageUrls, expected, 'delivered set is the top DELIVER_COUNT by score');

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

  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_SCORE_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(mid.status, ORDER_STATES.GENERATING, 'still GENERATING: selection did not finish');
  assert.equal(nonNull(mid.resultImageUrls).length, GENERATE_COUNT, 'all candidates generated before the crash');
  assert.equal(nonNull(mid.candidateScores).length, 0, 'no score persisted (crashed on the first score)');
  assert.equal(mid.deliveredImageUrls?.length ?? 0, 0, 'nothing delivered yet');
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'candidates generated exactly once');

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'delivered after restart');
  assert.equal(fake.getCounts().startGeneration, GENERATE_COUNT, 'candidates never regenerated during selection retry');
  assert.equal(done.candidateScores.length, GENERATE_COUNT, 'every candidate scored');
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
  const scorer = makeScorer();

  const GENERATE_COUNT = 6;
  const DELIVER_COUNT = 3;
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
  fake.resetFake({ trainingStatusSeq: ['failed'] });

  const stripe = makeFakeStripe();
  const ensureRefund = createEnsureRefund({ stripe });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    stripePaymentIntentId: 'pi_test_123',
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({ onFailed: ensureRefund });

  let thrown;
  await assert.rejects(
    () => pipeline.processOrder(id),
    (err) => ((thrown = err), /training .* failed/.test(err.message))
  );

  const midStatus = await Order.findById(id);
  assert.equal(midStatus.status, ORDER_STATES.TRAINING, 'still TRAINING at the point of failure');

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

  await pipeline.processOrder(id); 
  await pipeline.failOrder(id, thrown); 

  const afterRestart = await Order.findById(id);
  assert.equal(afterRestart.status, ORDER_STATES.FAILED, 'still FAILED after restart');
  assert.equal(stripe.refundCount(), 1, 'refund count is STILL exactly 1, never refunded twice');
});

test('cost invariant: with identity culling OFF, generate == deliver (never pay for extra images)', async () => {
  fake.resetFake({ generationStatusSeq: ['succeeded'] });

  const DELIVER_COUNT = 14; 
  const GENERATE_COUNT = DELIVER_COUNT; 
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

  assert.equal(
    fake.getCounts().startGeneration,
    done.deliveredImageUrls.length,
    'startGeneration count == deliveredImageUrls.length (generate exactly what we deliver)'
  );
  assert.equal(fake.getCounts().startGeneration, DELIVER_COUNT, 'generated exactly DELIVER_COUNT (14)');
  assert.equal(done.deliveredImageUrls.length, DELIVER_COUNT, 'delivered exactly DELIVER_COUNT (14)');
});


test('delivered images are persisted to our storage under deterministic keys', async () => {
  const GENERATE_COUNT = 6;
  const DELIVER_COUNT = 4;
  const scorer = makeScorer({ scoreFor: (url) => 1 - predNum(url) / 100 });
  const persist = makePersister();

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 't', trainedModelVersion: 'o/m:v1' },
  });
  const id = order._id.toString();

  const pipeline = buildPipeline({
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    scoreIdentity: scorer,
    persistImage: persist,
  });
  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(done.persistedImageUrls.length, DELIVER_COUNT, 'every delivered slot persisted');
  assert.equal(persist.callCount(), DELIVER_COUNT, 'persist called once per delivered slot');
  assert.deepEqual(done.deliveredImageUrls, done.persistedImageUrls);
  assert.ok(
    done.deliveredImageUrls.every((u, i) => u === `https://r2.local/deliveries/${id}/${i}.jpg`),
    'stored under deliveries/<orderId>/<i> keys'
  );
});

test('a crash mid-persistence resumes without re-copying already-persisted slots', async () => {
  const GENERATE_COUNT = 6;
  const DELIVER_COUNT = 4;
  const scorer = makeScorer({ scoreFor: (url) => 1 - predNum(url) / 100 });
  const persist = makePersister({ crashOnCall: 3 }); 

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 't', trainedModelVersion: 'o/m:v1' },
  });
  const id = order._id.toString();

  const pipeline = buildPipeline({
    generateCount: GENERATE_COUNT,
    deliverCount: DELIVER_COUNT,
    scoreIdentity: scorer,
    persistImage: persist,
  });

  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_PERSIST_CRASH/);
  const mid = await Order.findById(id);
  assert.equal(mid.status, ORDER_STATES.GENERATING, 'not delivered yet');
  assert.equal(nonNull(mid.persistedImageUrls).length, 2, 'two slots persisted before the crash');
  assert.equal(mid.deliveredImageUrls.length, 0, 'delivered set not finalized');

  await pipeline.processOrder(id);
  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(persist.callCount(), DELIVER_COUNT + 1, 'crashed slot retried once; done slots not re-copied');
  assert.equal(done.persistedImageUrls.length, DELIVER_COUNT);
  assert.deepEqual(done.deliveredImageUrls, done.persistedImageUrls);
});


test('a training stuck in "starting" (no hardware) is cancelled and restarted fresh', async () => {
  fake.resetFake({ unallocatedTrainings: 1 }); 

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({ startingMaxWaitMs: 25, maxTrainingRestarts: 3 });

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'completes on the fresh training');
  assert.equal(fake.getCounts().startTraining, 2, 'exactly two trainings (original + one fresh)');
  assert.ok(fake.getCounts().cancelTraining >= 1, 'the wedged training was cancelled');
  assert.equal(done.replicate.trainingRestarts, 1, 'one restart recorded');
});

test('a training that allocates LATE still completes (running clock starts at allocation)', async () => {
  fake.resetFake({ allocateAfterPolls: 6, trainingStatusSeq: ['processing', 'succeeded'] });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({ pollIntervalMs: 50, trainingMaxWaitMs: 150, startingMaxWaitMs: 10000 });

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'completes despite the long allocation wait');
  assert.equal(fake.getCounts().startTraining, 1, 'no restart needed -- it was allocated, just late');
  assert.equal(fake.getCounts().cancelTraining, 0, 'never cancelled');
});

test('a persistently unallocated training gives up after maxTrainingRestarts', async () => {
  fake.resetFake({ unallocatedTrainings: 99 }); 

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
  });
  const id = order._id.toString();
  const pipeline = buildPipeline({ startingMaxWaitMs: 15, maxTrainingRestarts: 2 });

  await assert.rejects(() => pipeline.processOrder(id), /could not get hardware/);
  assert.equal(fake.getCounts().startTraining, 3, 'tried original + maxTrainingRestarts fresh trainings');
  assert.equal(fake.getCounts().cancelTraining, 3, 'each wedged training was cancelled');
  const stuck = await Order.findById(id);
  assert.equal(stuck.status, ORDER_STATES.TRAINING, 'still TRAINING; the worker failed handler fails+refunds it');
});

test('per-order tier counts drive generation + delivery, overriding the pipeline defaults', async () => {
  fake.resetFake();

  const pipeline = buildPipeline({
    generateCount: 14,
    deliverCount: 14,
    scoreIdentity: makeScorer({ scoreFor: (url) => predNum(url) }), 
  });

  const order = await Order.create({
    customerEmail: 'tiered@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
    generateCount: 6,
    deliverCount: 3,
  });
  const id = order._id.toString();

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(
    fake.getCounts().startGeneration,
    6,
    'generated the ORDER generateCount (6), not the pipeline default (14)'
  );
  assert.equal(nonNull(done.resultImageUrls).length, 6, 'kept 6 candidates');
  assert.equal(
    nonNull(done.deliveredImageUrls).length,
    3,
    'delivered the ORDER deliverCount (3), not the pipeline default (14)'
  );
});

test('an order with NO tier counts falls back to the pipeline defaults', async () => {
  fake.resetFake();

  const pipeline = buildPipeline({ generateCount: 5, deliverCount: 5 });
  const order = await Order.create({
    customerEmail: 'legacy@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(fake.getCounts().startGeneration, 5, 'fell back to the pipeline default generateCount (5)');
  assert.equal(nonNull(done.deliveredImageUrls).length, 5, 'delivered the pipeline default deliverCount (5)');
});

test('culling ON overgenerates by the factor, then culls down to deliverCount', async () => {
  fake.resetFake();

  const pipeline = buildPipeline({
    deliverCount: 4,
    cullingEnabled: true,
    overgenerateFactor: 1.5,
    scoreIdentity: makeScorer({ scoreFor: (url) => predNum(url) }), 
  });

  const order = await Order.create({
    customerEmail: 'cull@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
    deliverCount: 4,
  });
  const id = order._id.toString();

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(fake.getCounts().startGeneration, 6, 'overgenerated to ceil(deliver * 1.5) = 6');
  assert.equal(nonNull(done.resultImageUrls).length, 6, 'kept all 6 raw candidates');
  assert.equal(nonNull(done.candidateScores).length, 6, 'scored all 6');
  assert.equal(nonNull(done.deliveredImageUrls).length, 4, 'culled down to deliverCount (4)');
});

test('culling OFF generates exactly deliverCount (no overgeneration / no waste)', async () => {
  fake.resetFake();

  const pipeline = buildPipeline({
    deliverCount: 4,
    cullingEnabled: false,
    overgenerateFactor: 1.5,
  });

  const order = await Order.create({
    customerEmail: 'nocull@b.com',
    status: ORDER_STATES.TRAINING,
    uploadedImageUrls: ['selfie.jpg'],
    selectedLooks: SAMPLE_LOOKS,
    selectedAttire: SAMPLE_ATTIRE,
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
    deliverCount: 4,
    generateCount: 4,
  });
  const id = order._id.toString();

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(fake.getCounts().startGeneration, 4, 'no overgeneration when culling is off');
  assert.equal(nonNull(done.deliveredImageUrls).length, 4, 'delivered deliverCount');
});

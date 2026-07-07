import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { Order, ORDER_STATES } from '@headliner/shared';
import { createPipeline } from '../pipeline.js';
import * as fake from '../replicateClient.fake.js';

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
function buildPipeline(prompts) {
  return createPipeline({
    client: fake,
    prompts,
    imageZipUrl: 'https://fake.local/selfies.zip',
    pollIntervalMs: 1,
    trainingMaxWaitMs: 60_000,
    generationMaxWaitMs: 60_000,
  });
}

const nonNull = (arr) => (arr ?? []).filter((v) => v != null);

test('scenario 1: crash after trainingId persisted, before success -> reattaches, startTraining called exactly once', async () => {
  // Training reports 'processing' then 'succeeded', but the FIRST poll crashes.
  fake.resetFake({
    trainingStatusSeq: ['processing', 'succeeded'],
    crashOn: { pollTraining: 1 },
  });

  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.PAID,
    uploadedImageUrls: ['selfie.jpg'],
  });
  const id = order._id.toString();
  const pipeline = buildPipeline(['one prompt']);

  // Run 1: PAID -> TRAINING, startTraining, persist trainingId, then the first
  // training poll crashes (before it ever reports success).
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
  const pipeline = buildPipeline(['one prompt']);

  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED);
  assert.equal(fake.getCounts().startTraining, 0, 'training entirely skipped');
  assert.equal(fake.getCounts().pollTraining, 0, 'training never even polled');
  assert.ok(fake.getCounts().startGeneration >= 1, 'went straight into generating');
});

test('scenario 3: crash mid-generation with 3/7 slots done -> only missing 4 reattach, startGeneration total == 7', async () => {
  // Each generation succeeds on its first poll; crash on the 4th generation poll,
  // i.e. after 3 slots have been collected.
  fake.resetFake({
    generationStatusSeq: ['succeeded'],
    crashOn: { pollGeneration: 4 },
  });

  const prompts = Array.from({ length: 7 }, (_, i) => `headshot prompt ${i}`);
  const order = await Order.create({
    customerEmail: 'a@b.com',
    status: ORDER_STATES.GENERATING,
    uploadedImageUrls: ['selfie.jpg'],
    replicate: { trainingId: 'train_pre', trainedModelVersion: 'fakeowner/fakemodel:v1' },
  });
  const id = order._id.toString();
  const pipeline = buildPipeline(prompts);

  // Run 1: all 7 predictions get STARTED (ids persisted), 3 collected, then the
  // 4th poll crashes.
  await assert.rejects(() => pipeline.processOrder(id), /SIMULATED_CRASH/);

  const mid = await Order.findById(id);
  assert.equal(fake.getCounts().startGeneration, 7, 'all 7 slots started exactly once');
  const idsAfterCrash = [...mid.replicate.generationIds];
  assert.equal(idsAfterCrash.filter(Boolean).length, 7, 'all 7 predictionIds persisted');
  assert.equal(nonNull(mid.resultImageUrls).length, 3, 'exactly 3 images collected before crash');

  // Run 2 (restart): the 4 missing slots must REATTACH to their existing
  // predictionIds; no new generation is started.
  await pipeline.processOrder(id);

  const done = await Order.findById(id);
  assert.equal(done.status, ORDER_STATES.DELIVERED, 'order completes after restart');
  assert.equal(fake.getCounts().startGeneration, 7, 'startGeneration total is 7, never more');
  assert.deepEqual(
    [...done.replicate.generationIds],
    idsAfterCrash,
    'same 7 predictionIds reused (reattached, not regenerated)'
  );
  assert.equal(nonNull(done.resultImageUrls).length, 7, 'all 7 images collected');
});

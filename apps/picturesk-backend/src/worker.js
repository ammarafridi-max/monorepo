import { captureError } from './instrument.js';
import { Worker } from 'bullmq';
import JSZip from 'jszip';
import Stripe from 'stripe';

import {
  buildPrompts,
  buildSubject,
  connectMongo,
  createRedisConnection,
  createStorage,
  createEmailClient,
  Order,
  QUEUE_NAMES,
} from '@travel-suite/picturesk-shared';
import { TRIGGER_WORD } from './pipeline/replicateClient.js';
import { createPipeline } from './pipeline/pipeline.js';
import { createEnsureRefund } from './pipeline/refund.js';
import { classifyFacialHair } from './pipeline/classifyFacialHair.js';


const USE_FAKE_REPLICATE = process.env.USE_FAKE_REPLICATE === '1';

const USE_PULID = (process.env.GENERATION_BACKEND || 'lora').toLowerCase() === 'pulid';

const {
  MONGODB_URI,
  REDIS_URL,
  TEST_IMAGE_ZIP_URL,
  STRIPE_SECRET_KEY,
  WEB_BASE_URL = 'http://localhost:3000',
  BREVO_API_KEY,
  BREVO_SENDER = 'Picturesk.ai <hello@picturesk.ai>',
} = process.env;
if (!MONGODB_URI) throw new Error('[worker] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[worker] REDIS_URL is required');

function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`[worker] ${name} must be a positive integer, got "${raw}"`);
  }
  return n;
}

const IDENTITY_SCORING = !USE_PULID && Boolean(process.env.REPLICATE_FACE_EMBED_MODEL);

const DELIVER_COUNT = intEnv('DELIVER_COUNT', 14);
const GENERATE_COUNT = IDENTITY_SCORING ? intEnv('GENERATE_COUNT', 20) : DELIVER_COUNT;
if (GENERATE_COUNT < DELIVER_COUNT) {
  throw new Error(
    `[worker] GENERATE_COUNT (${GENERATE_COUNT}) must be >= DELIVER_COUNT (${DELIVER_COUNT})`
  );
}

if (!USE_FAKE_REPLICATE) {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error('[worker] REPLICATE_API_TOKEN is required');
  if (!USE_PULID && !process.env.REPLICATE_DESTINATION_MODEL)
    throw new Error('[worker] REPLICATE_DESTINATION_MODEL is required (owner/name)');
  if (!STRIPE_SECRET_KEY) throw new Error('[worker] STRIPE_SECRET_KEY is required (refunds)');
}

const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

const client = USE_FAKE_REPLICATE
  ? await import('./pipeline/replicateClient.fake.js')
  : USE_PULID
    ? await import('./pipeline/replicateClient.pulid.js')
    : await import('./pipeline/replicateClient.js');
const scoreIdentity = IDENTITY_SCORING
  ? (
      USE_FAKE_REPLICATE
        ? await import('./pipeline/scoreIdentity.fake.js')
        : await import('./pipeline/scoreIdentity.js')
    ).scoreIdentity
  : undefined;

const FACE_SWAP = !USE_PULID && Boolean(process.env.REPLICATE_FACE_SWAP_MODEL);
const swapFace = FACE_SWAP
  ? (
      USE_FAKE_REPLICATE
        ? await import('./pipeline/swapFace.fake.js')
        : await import('./pipeline/swapFace.js')
    ).swapFace
  : undefined;

const ENHANCE_FACE = Boolean(process.env.REPLICATE_ENHANCE_MODEL);
const enhanceFace = ENHANCE_FACE
  ? (
      USE_FAKE_REPLICATE
        ? await import('./pipeline/enhanceFace.fake.js')
        : await import('./pipeline/enhanceFace.js')
    ).enhanceFace
  : undefined;

const PERSIST_DELIVERED = (process.env.PERSIST_DELIVERED ?? 'on') !== 'off';
const persistImage = PERSIST_DELIVERED
  ? (
      USE_FAKE_REPLICATE
        ? await import('./pipeline/persistImage.fake.js')
        : await import('./pipeline/persistImage.js')
    ).createImagePersister()
  : undefined;
const persistWeights = (
  USE_FAKE_REPLICATE
    ? await import('./pipeline/persistImage.fake.js')
    : await import('./pipeline/persistImage.js')
).createWeightsPersister();
if (USE_FAKE_REPLICATE) console.warn('[worker] USE_FAKE_REPLICATE=1: using the in-memory fake client');
console.log(
  `[worker] identity culling ${
    IDENTITY_SCORING ? 'ON' : 'OFF (deferred; set REPLICATE_FACE_EMBED_MODEL to enable)'
  }`
);
console.log(`[worker] face swap ${FACE_SWAP ? 'ON' : 'OFF (set REPLICATE_FACE_SWAP_MODEL to enable)'}`);
console.log(
  `[worker] realism enhance ${ENHANCE_FACE ? 'ON' : 'OFF (set REPLICATE_ENHANCE_MODEL to enable)'}`
);
console.log(
  `[worker] delivered-image persistence ${PERSIST_DELIVERED ? 'ON (copied to R2)' : 'OFF (PERSIST_DELIVERED=off)'}`
);
console.log(
  `[worker] generation backend: ${USE_PULID ? 'pulid (no training; reference-image identity)' : 'lora'}`
);
console.log(
  `[worker] counts per order from its pricing tier; fallback for legacy orders: generate=${GENERATE_COUNT} deliver=${DELIVER_COUNT}`
);

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

async function resolvePulidReference(order) {
  const reference = (order.uploadedImageUrls ?? [])[0] || null;
  if (!reference) return null;
  if (!order.facialHair && !order.derivedFacialHair) {
    const derived = await classifyFacialHair(reference);
    if (derived) {
      await Order.updateOne({ _id: order._id }, { $set: { derivedFacialHair: derived } });
      console.log(`[worker] order ${order._id} derived facial hair: ${derived}`);
    }
  }
  return reference;
}

async function resolveTrainingZip(order) {
  if (TEST_IMAGE_ZIP_URL) return TEST_IMAGE_ZIP_URL; 

  const urls = order.uploadedImageUrls ?? [];
  if (urls.length === 0) return null;

  const zip = new JSZip();
  for (let i = 0; i < urls.length; i++) {
    const res = await fetch(urls[i]);
    if (!res.ok) throw new Error(`[worker] fetch training image ${urls[i]} -> ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = (res.headers.get('content-type') || '').split('/')[1]?.split(';')[0] || 'jpg';
    zip.file(`img_${String(i).padStart(2, '0')}.${ext}`, buf);
  }
  const body = await zip.generateAsync({ type: 'nodebuffer' });

  const storage = createStorage();
  const url = await storage.putObject(`training/${order._id}.zip`, body, 'application/zip');
  console.log(`[worker] order ${order._id} training zip built (${urls.length} images)`);
  return url;
}

const emailClient = BREVO_API_KEY
  ? createEmailClient({ apiKey: BREVO_API_KEY, sender: BREVO_SENDER })
  : null;

async function onDelivered(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.deliveredEmailSentAt) return;

  if (!emailClient) {
    console.warn(`[worker] order ${orderId} delivered but BREVO_API_KEY unset; email skipped`);
    return;
  }

  const token = order.publicToken ? `&t=${order.publicToken}` : '';
  const resultsUrl = `${WEB_BASE_URL}/success?orderId=${orderId}${token}`;
  try {
    await emailClient.sendDeliveryEmail({
      to: order.customerEmail,
      resultsUrl,
      orderId,
      thumbnailUrls: order.deliveredImageUrls ?? [],
      product: order.product,
    });
  } catch (err) {
    console.error(`[worker] order ${orderId} delivery email failed, will retry: ${err.message}`);
    throw err;
  }
  await Order.updateOne({ _id: orderId }, { $set: { deliveredEmailSentAt: new Date() } });
  console.log(`[worker] order ${orderId} delivery email sent to ${order.customerEmail}`);
}

// Idempotent auto-refund for a FAILED order (logic in refund.js so the Stripe
const ensureRefund = createEnsureRefund({ stripe });

const subjectAnchorFor = (order) => {
  const subject = buildSubject({
    gender: order.gender,
    ageRange: order.ageRange,
    race: order.race,
    build: order.build,
    height: order.height,
    facialHair: order.facialHair || order.derivedFacialHair,
  });
  return USE_PULID ? `${subject}, a calm, subtle closed-mouth expression` : `${TRIGGER_WORD}, ${subject}`;
};

const buildOrderPrompts = (order, count) =>
  buildPrompts({
    looks: order.selectedLooks ?? [],
    attire: order.selectedAttire ?? [],
    count: count ?? order.generateCount ?? GENERATE_COUNT,
    subjectAnchor: subjectAnchorFor(order),
    product: order.product,
    gender: order.gender,
  });

const pipeline = createPipeline({
  client,
  buildPrompts: buildOrderPrompts,
  scoreIdentity,
  swapFace,
  enhanceFace,
  persistImage,
  persistWeights,
  generateCount: GENERATE_COUNT,
  deliverCount: DELIVER_COUNT,
  scoreConcurrency: Number(process.env.SCORE_CONCURRENCY) || 6,
  cullingEnabled: IDENTITY_SCORING,
  overgenerateFactor: Number(process.env.OVERGENERATE_FACTOR) || 1.5,
  startingMaxWaitMs: (Number(process.env.TRAINING_STARTING_MAX_MIN) || 45) * 60 * 1000,
  maxTrainingRestarts: Number.isFinite(Number(process.env.TRAINING_MAX_RESTARTS))
    ? Number(process.env.TRAINING_MAX_RESTARTS)
    : 1,
  resolveTrainingZip: USE_PULID ? resolvePulidReference : resolveTrainingZip,
  onDelivered,
  onFailed: ensureRefund,
});

const connection = createRedisConnection(REDIS_URL);

const WORKER_CONCURRENCY = Number(process.env.WORKER_CONCURRENCY) || 1;

const worker = new Worker(
  QUEUE_NAMES.ORDER_PIPELINE,
  async (job) => {
    const { orderId } = job.data;
    console.log(`[worker] picked up job ${job.id} for order ${orderId}`);
    await pipeline.processOrder(orderId);
  },
  {
    connection,
    concurrency: WORKER_CONCURRENCY,
    drainDelay: Number(process.env.WORKER_DRAIN_DELAY_S) || 60, 
    stalledInterval: Number(process.env.WORKER_STALLED_INTERVAL_MS) || 300000, 
    lockDuration: Number(process.env.WORKER_LOCK_DURATION_MS) || 120000, 
  }
);

let lastWorkerErrorLog = 0;
worker.on('error', (err) => {
  const now = Date.now();
  if (now - lastWorkerErrorLog > 10000) {
    lastWorkerErrorLog = now;
    console.error(`[worker] worker/redis error (throttled): ${err.message}`);
  }
});

worker.on('completed', (job) => {
  console.log(`[worker] job ${job.id} completed`);
});

worker.on('failed', async (job, err) => {
  const attempts = job?.opts?.attempts ?? 0;
  console.error(
    `[worker] job ${job?.id} failed (attempt ${job?.attemptsMade}/${attempts}): ${err.message}`
  );

  if (!job) return;

  captureError(err, {
    jobId: job.id,
    orderId: job.data?.orderId,
    attempt: job.attemptsMade,
    attempts,
    finalAttempt: job.attemptsMade >= attempts,
  });

  if (job.attemptsMade < attempts) return;

  // Move the order to FAILED (recording the error) and issue the idempotent
  try {
    await pipeline.failOrder(job.data.orderId, err);
  } catch (e) {
    console.error(`[worker] failure handling error for ${job.data.orderId}: ${e.message}`);
    captureError(e, { orderId: job.data?.orderId, phase: 'failOrder' });
  }
});

console.log(
  `[worker] started, listening on '${QUEUE_NAMES.ORDER_PIPELINE}' (concurrency ${WORKER_CONCURRENCY})`
);

// MUST be first: arms Sentry (and its crash handlers) and loads the root .env
// before any pipeline code runs.
import { captureError } from './instrument.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import dotenv from 'dotenv';
import { Worker } from 'bullmq';
import JSZip from 'jszip';
import Stripe from 'stripe';

// Load the monorepo-root .env regardless of the cwd this service is started from
// (pnpm --filter runs scripts with the package dir as cwd).
dotenv.config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../.env') });

import {
  buildPrompts,
  buildSubject,
  connectMongo,
  createRedisConnection,
  createStorage,
  createEmailClient,
  Order,
  QUEUE_NAMES,
} from '@picturesk/shared';
import { TRIGGER_WORD } from './replicateClient.js';
import { createPipeline } from './pipeline.js';
import { createEnsureRefund } from './refund.js';
import { classifyFacialHair } from './classifyFacialHair.js';

/**
 * Picturesk worker (Phase 5: failure hardening).
 *
 * Consumes order-pipeline jobs and drives an order PAID -> TRAINING ->
 * GENERATING -> DELIVERED. The resumable, per-stage-idempotent logic lives in
 * pipeline.js; the Replicate client, training-zip builder, delivery email, and
 * refund are injected. On failure the order moves to FAILED and, if the customer
 * paid, is refunded exactly once (receipt-before-acting via refundedAt + a Stripe
 * idempotency key). Set USE_FAKE_REPLICATE=1 to drive the fake client.
 */

const USE_FAKE_REPLICATE = process.env.USE_FAKE_REPLICATE === '1';

// Generation backend. 'lora' (default): per-user LoRA training + generation, with
// optional culling/swap. 'pulid': NO training -- identity comes from a reference
// selfie fed to bytedance/flux-pulid at generation time, which fixes face shape and
// removes the train/cull/swap machinery. Gated so prod is unchanged until flipped.
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

/** Parse a positive-integer env var, falling back to a default. */
function intEnv(name, fallback) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`[worker] ${name} must be a positive integer, got "${raw}"`);
  }
  return n;
}

// Identity-based candidate culling is OPTIONAL and currently DEFERRED: it needs a
// real face-embedding model on Replicate via REPLICATE_FACE_EMBED_MODEL, and no
// off-the-shelf model fits our contract yet (see "Deferred" in the README). When
// that var is UNSET the feature is OFF: we generate exactly what we deliver and
// skip scoring, so delivery behaves exactly as it did before. Set it (once you
// deploy an embedding model) to turn on overgenerate-and-cull.
// PuLID already locks identity + face shape from the reference, so culling adds no
// value there -- force it off in PuLID mode regardless of the env var.
const IDENTITY_SCORING = !USE_PULID && Boolean(process.env.REPLICATE_FACE_EMBED_MODEL);

// How many headshots we deliver. With culling ON we generate MORE candidates
// (GENERATE_COUNT) and keep the best DELIVER_COUNT; with culling OFF we generate
// exactly what we deliver, so there is no overgeneration cost.
const DELIVER_COUNT = intEnv('DELIVER_COUNT', 14);
const GENERATE_COUNT = IDENTITY_SCORING ? intEnv('GENERATE_COUNT', 20) : DELIVER_COUNT;
if (GENERATE_COUNT < DELIVER_COUNT) {
  throw new Error(
    `[worker] GENERATE_COUNT (${GENERATE_COUNT}) must be >= DELIVER_COUNT (${DELIVER_COUNT})`
  );
}

if (!USE_FAKE_REPLICATE) {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error('[worker] REPLICATE_API_TOKEN is required');
  // The destination model is the LoRA trainer's push target -- only the 'lora'
  // backend trains, so PuLID does not need it.
  if (!USE_PULID && !process.env.REPLICATE_DESTINATION_MODEL)
    throw new Error('[worker] REPLICATE_DESTINATION_MODEL is required (owner/name)');
  // NOTE: REPLICATE_FACE_EMBED_MODEL is intentionally NOT required. Identity
  // culling is OFF until it is set (and always off in PuLID mode).
  // Refunds are money-critical: the real worker must be able to issue them.
  if (!STRIPE_SECRET_KEY) throw new Error('[worker] STRIPE_SECRET_KEY is required (refunds)');
}

// Stripe client for refunds. null only in the fake path (no real money).
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Pick the generation client. All three expose the same
// startTraining/pollTraining/startGeneration/pollGeneration interface, so the
// pipeline is identical across them: the fake (in-memory), the LoRA client (real
// training + generation), or the PuLID client (no training; reference-image
// generation).
const client = USE_FAKE_REPLICATE
  ? await import('./replicateClient.fake.js')
  : USE_PULID
    ? await import('./replicateClient.pulid.js')
    : await import('./replicateClient.js');
// The identity scorer, loaded ONLY when culling is enabled (it needs the embed
// model). When disabled, the pipeline uses its neutral default scorer and makes
// no embedding calls. Real/fake split mirrors the Replicate client.
const scoreIdentity = IDENTITY_SCORING
  ? (
      USE_FAKE_REPLICATE
        ? await import('./scoreIdentity.fake.js')
        : await import('./scoreIdentity.js')
    ).scoreIdentity
  : undefined;

// Identity lock via face swap. Gated on REPLICATE_FACE_SWAP_MODEL: when set, the
// pipeline swaps the customer's real face onto each delivered headshot (fixing face
// shape / hair / expression the LoRA drifts on). Unset = OFF, delivery unchanged.
// Also off in PuLID mode: PuLID already delivers the real face/shape, so a swap
// on top is redundant.
const FACE_SWAP = !USE_PULID && Boolean(process.env.REPLICATE_FACE_SWAP_MODEL);
const swapFace = FACE_SWAP
  ? (
      USE_FAKE_REPLICATE
        ? await import('./swapFace.fake.js')
        : await import('./swapFace.js')
    ).swapFace
  : undefined;

// Realism enhancement (final polish). Gated on REPLICATE_ENHANCE_MODEL: when set,
// each delivered image is run through a creative upscaler at low creativity to add
// skin texture + sharpen eyes (de-plastic) without changing identity. Backend-
// agnostic -- applies to whatever the delivered set is (LoRA, swapped, or PuLID).
const ENHANCE_FACE = Boolean(process.env.REPLICATE_ENHANCE_MODEL);
const enhanceFace = ENHANCE_FACE
  ? (
      USE_FAKE_REPLICATE
        ? await import('./enhanceFace.fake.js')
        : await import('./enhanceFace.js')
    ).enhanceFace
  : undefined;

// DURABILITY: persist the final delivered images into our R2 bucket so they do not
// expire with the upstream (replicate.delivery) URLs. ON by default (R2 is already
// required by the worker); set PERSIST_DELIVERED=off to fall back to the ephemeral
// upstream URLs. The fake variant (no R2/network) is used under USE_FAKE_REPLICATE.
const PERSIST_DELIVERED = (process.env.PERSIST_DELIVERED ?? 'on') !== 'off';
const persistImage = PERSIST_DELIVERED
  ? (
      USE_FAKE_REPLICATE
        ? await import('./persistImage.fake.js')
        : await import('./persistImage.js')
    ).createImagePersister()
  : undefined;
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

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

// PuLID "training input" is just the reference selfie fed to the model at
// generation time (the pipeline threads it through the training slot, see
// replicateClient.pulid.js). Use the first uploaded selfie; the upload gate has
// already ensured it has a detectable face.
async function resolvePulidReference(order) {
  const reference = (order.uploadedImageUrls ?? [])[0] || null;
  if (!reference) return null;
  // If the customer left facial hair blank, infer it from the reference so the
  // prompt names the real beard and PuLID renders it (instead of a generic short
  // one). Persist once; non-fatal -- a miss just means no derived descriptor.
  if (!order.facialHair && !order.derivedFacialHair) {
    const derived = await classifyFacialHair(reference);
    if (derived) {
      await Order.updateOne({ _id: order._id }, { $set: { derivedFacialHair: derived } });
      console.log(`[worker] order ${order._id} derived facial hair: ${derived}`);
    }
  }
  return reference;
}

/**
 * Resolve the training-images zip for an order. The flux trainer wants a single
 * zip URL, but an order carries individual selfie URLs, so we download them and
 * zip them into R2. TEST_IMAGE_ZIP_URL is an optional dev override that skips
 * the build entirely.
 */
async function resolveTrainingZip(order) {
  if (TEST_IMAGE_ZIP_URL) return TEST_IMAGE_ZIP_URL; // dev override

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

// Brevo transactional email client. null when BREVO_API_KEY is unset, which
// keeps email a clean no-op for local dev (same behavior as the old Resend path).
const emailClient = BREVO_API_KEY
  ? createEmailClient({ apiKey: BREVO_API_KEY, sender: BREVO_SENDER })
  : null;

/**
 * Idempotent delivery. Send the results email exactly once, guarded by
 * deliveredEmailSentAt (set only on success). If sending FAILS we throw so
 * BullMQ retries the job, which re-enters the DELIVERED case and tries again;
 * this closes the Phase 4 best-effort gap. The throw never affects order state:
 * the order is already DELIVERED (terminal), and the failed handler skips
 * terminal orders. A missing BREVO_API_KEY is treated as "email disabled" (dev)
 * and does NOT retry.
 */
async function onDelivered(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.deliveredEmailSentAt) return;

  if (!emailClient) {
    console.warn(`[worker] order ${orderId} delivered but BREVO_API_KEY unset; email skipped`);
    return;
  }

  const resultsUrl = `${WEB_BASE_URL}/success?orderId=${orderId}`;
  try {
    await emailClient.sendDeliveryEmail({
      to: order.customerEmail,
      resultsUrl,
      orderId,
      // The culled best set from candidate selection, not the full candidate list.
      thumbnailUrls: order.deliveredImageUrls ?? [],
    });
  } catch (err) {
    // Leave deliveredEmailSentAt unset and let the retry re-attempt.
    console.error(`[worker] order ${orderId} delivery email failed, will retry: ${err.message}`);
    throw err;
  }
  await Order.updateOne({ _id: orderId }, { $set: { deliveredEmailSentAt: new Date() } });
  console.log(`[worker] order ${orderId} delivery email sent to ${order.customerEmail}`);
}

// Idempotent auto-refund for a FAILED order (logic in refund.js so the Stripe
// client can be injected; a counting stub replaces it in tests).
const ensureRefund = createEnsureRefund({ stripe });

// The subject anchor every prompt leads with, built PER ORDER from its demographics
// via the shared buildSubject (gender/age/race/facial hair, e.g. "a man in their
// thirties, with a full beard"). In LoRA mode it is prefixed with the trigger word
// that activates the trained face. In PuLID mode there is NO trigger (identity comes
// from the reference image), so we use the plain subject description.
const subjectAnchorFor = (order) => {
  const subject = buildSubject({
    gender: order.gender,
    ageRange: order.ageRange,
    race: order.race,
    // Prefer the customer's choice; fall back to the vision-inferred one (PuLID).
    facialHair: order.facialHair || order.derivedFacialHair,
  });
  // PuLID re-synthesizes the face, so name a calm closed-mouth expression to beat
  // FLUX's toothy-grin prior (the client also carries a teeth negative prompt).
  return USE_PULID ? `${subject}, a calm, subtle closed-mouth expression` : `${TRIGGER_WORD}, ${subject}`;
};

// Per-order prompt builder: turn the order's selected looks/attire into
// GENERATE_COUNT prompts via the SHARED catalog buildPrompts, the single source
// of truth the web also renders its options from, so shown options can never
// drift from what we generate.
const buildOrderPrompts = (order) =>
  buildPrompts({
    looks: order.selectedLooks ?? [],
    attire: order.selectedAttire ?? [],
    count: GENERATE_COUNT,
    subjectAnchor: subjectAnchorFor(order),
  });

const pipeline = createPipeline({
  client,
  buildPrompts: buildOrderPrompts,
  scoreIdentity,
  swapFace,
  enhanceFace,
  persistImage,
  generateCount: GENERATE_COUNT,
  deliverCount: DELIVER_COUNT,
  // Wedged-training recovery: if a training sits in "starting" (no hardware) longer
  // than this, cancel it and start a fresh one, up to this many times, instead of
  // waiting the full training window on a training Replicate never allocated.
  startingMaxWaitMs: (Number(process.env.TRAINING_STARTING_MAX_MIN) || 5) * 60 * 1000,
  maxTrainingRestarts: Number.isFinite(Number(process.env.TRAINING_MAX_RESTARTS))
    ? Number(process.env.TRAINING_MAX_RESTARTS)
    : 3,
  // PuLID has no zip to build; its "training input" is the reference selfie.
  resolveTrainingZip: USE_PULID ? resolvePulidReference : resolveTrainingZip,
  onDelivered,
  onFailed: ensureRefund,
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

  // Report every job failure to Sentry with NON-PII context only (orderId/jobId
  // are ids, not customer data). This is how a failing pipeline surfaces in prod.
  captureError(err, {
    jobId: job.id,
    orderId: job.data?.orderId,
    attempt: job.attemptsMade,
    attempts,
    finalAttempt: job.attemptsMade >= attempts,
  });

  // Only give up once BullMQ has exhausted all retries. Before that, let the
  // queue back off and try again.
  if (job.attemptsMade < attempts) return;

  // Move the order to FAILED (recording the error) and issue the idempotent
  // refund. All of that lives in pipeline.failOrder so it is one testable unit.
  try {
    await pipeline.failOrder(job.data.orderId, err);
  } catch (e) {
    console.error(`[worker] failure handling error for ${job.data.orderId}: ${e.message}`);
    // A refund/fail-transition error is the most important thing to surface:
    // money may be at stake and it is past the normal retry path.
    captureError(e, { orderId: job.data?.orderId, phase: 'failOrder' });
  }
});

console.log(`[worker] started, listening on '${QUEUE_NAMES.ORDER_PIPELINE}' (concurrency 1)`);

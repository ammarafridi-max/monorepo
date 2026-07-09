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
  connectMongo,
  createRedisConnection,
  createStorage,
  Order,
  QUEUE_NAMES,
} from '@headliner/shared';
import { PROMPTS } from './replicateClient.js';
import { createPipeline } from './pipeline.js';
import { sendDeliveryEmail } from './emailClient.js';
import { createEnsureRefund } from './refund.js';

/**
 * Headliner worker (Phase 5: failure hardening).
 *
 * Consumes order-pipeline jobs and drives an order PAID -> TRAINING ->
 * GENERATING -> DELIVERED. The resumable, per-stage-idempotent logic lives in
 * pipeline.js; the Replicate client, training-zip builder, delivery email, and
 * refund are injected. On failure the order moves to FAILED and, if the customer
 * paid, is refunded exactly once (receipt-before-acting via refundedAt + a Stripe
 * idempotency key). Set USE_FAKE_REPLICATE=1 to drive the fake client.
 */

const USE_FAKE_REPLICATE = process.env.USE_FAKE_REPLICATE === '1';

const {
  MONGODB_URI,
  REDIS_URL,
  TEST_IMAGE_ZIP_URL,
  STRIPE_SECRET_KEY,
  WEB_BASE_URL = 'http://localhost:3000',
  EMAIL_FROM = 'Headliner <onboarding@resend.dev>',
} = process.env;
if (!MONGODB_URI) throw new Error('[worker] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[worker] REDIS_URL is required');

if (!USE_FAKE_REPLICATE) {
  if (!process.env.REPLICATE_API_TOKEN) throw new Error('[worker] REPLICATE_API_TOKEN is required');
  if (!process.env.REPLICATE_DESTINATION_MODEL)
    throw new Error('[worker] REPLICATE_DESTINATION_MODEL is required (owner/name)');
  // Refunds are money-critical: the real worker must be able to issue them.
  if (!STRIPE_SECRET_KEY) throw new Error('[worker] STRIPE_SECRET_KEY is required (refunds)');
}

// Stripe client for refunds. null only in the fake path (no real money).
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// Pick the real Replicate client or the in-memory fake. The fake exposes the
// same startTraining/pollTraining/startGeneration/pollGeneration interface.
const client = USE_FAKE_REPLICATE
  ? await import('./replicateClient.fake.js')
  : await import('./replicateClient.js');
if (USE_FAKE_REPLICATE) console.warn('[worker] USE_FAKE_REPLICATE=1: using the in-memory fake client');

await connectMongo(MONGODB_URI);
console.log('[worker] connected to MongoDB');

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

/**
 * Idempotent delivery. Send the results email exactly once, guarded by
 * deliveredEmailSentAt (set only on success). If sending FAILS we throw so
 * BullMQ retries the job, which re-enters the DELIVERED case and tries again;
 * this closes the Phase 4 best-effort gap. The throw never affects order state:
 * the order is already DELIVERED (terminal), and the failed handler skips
 * terminal orders. A missing RESEND_API_KEY is treated as "email disabled" (dev)
 * and does NOT retry.
 */
async function onDelivered(orderId) {
  const order = await Order.findById(orderId);
  if (!order || order.deliveredEmailSentAt) return;

  if (!process.env.RESEND_API_KEY) {
    console.warn(`[worker] order ${orderId} delivered but RESEND_API_KEY unset; email skipped`);
    return;
  }

  const resultsUrl = `${WEB_BASE_URL}/success?orderId=${orderId}`;
  try {
    await sendDeliveryEmail({ to: order.customerEmail, from: EMAIL_FROM, resultsUrl });
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

const pipeline = createPipeline({
  client,
  prompts: PROMPTS,
  resolveTrainingZip,
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

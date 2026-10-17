import { Sentry, sentryEnabled, captureError } from './instrument.js';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { ZipArchive } from 'archiver';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import Stripe from 'stripe';
import { Queue } from 'bullmq';
import {
  connectMongo,
  createEmailClient,
  createRedisConnection,
  createStorage,
  isValidLook,
  isValidAttire,
  isValidAgeRange,
  isValidGender,
  isValidRace,
  isValidFacialHair,
  isValidBuild,
  isValidHeight,
  getTier,
  isValidTier,
  isFreeTier,
  TIERS,
  DEFAULT_TIER,
  isValidProduct,
  productOf,
  Order,
  ORDER_STATES,
  OrderTransitionConflictError,
  QUEUE_NAMES,
  transitionOrder,
} from '@travel-suite/picturesk-shared';
import { detectFaces } from './faceDetector.js';
import { assessPhoto } from './photoGate.js';
import { moderateImage, MODERATION_REASON } from './contentModerator.js';
import { QUALITY, evaluateImages, countError } from './uploadGate.js';
import { resolveReusableSelfies } from './reuse.js';
import { normalizeUpload } from './normalizeUpload.js';
import { RATE_LIMITS, createRateLimiters } from './rateLimit.js';
import { createBlogRouter, createBlogTagRouter } from '@travel-suite/blog';
import { createAffiliatesRouter } from '@travel-suite/affiliates';
import { createAdminSubsystem } from './admin/index.js';
import { createCloudinaryStorage } from '@travel-suite/cloudinary';
import { createAdminDataRouter } from './admin/adminData.js';
import { createAdminActionsRouter } from './admin/adminActions.js';


const MAX_UPLOAD_FILES = 20;

const IMAGE_EXT = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/tiff': 'tiff',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/heif': 'heif',
  'image/avif': 'avif',
};
const HAS_IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|tiff?|heic|heif|avif)$/i;

const {
  MONGODB_URI,
  REDIS_URL,
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  ADMIN_TOKEN,
  JWT_SECRET,
  JWT_EXPIRES_IN = '30d',
  JWT_COOKIE_EXPIRES_IN = '30',
  NODE_ENV = 'development',
  ANTHROPIC_API_KEY,
  BREVO_API_KEY,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  BREVO_SENDER = 'Picturesk.ai <hello@picturesk.ai>',
  WEB_BASE_URL = 'http://localhost:3000',
  PORT = 3001,
} = process.env;
if (!MONGODB_URI) throw new Error('[api] MONGODB_URI is required');
if (!REDIS_URL) throw new Error('[api] REDIS_URL is required');
if (!STRIPE_SECRET_KEY) throw new Error('[api] STRIPE_SECRET_KEY is required');
if (!STRIPE_WEBHOOK_SECRET) throw new Error('[api] STRIPE_WEBHOOK_SECRET is required');

const UPLOAD_QUALITY_GATE = (process.env.UPLOAD_QUALITY_GATE ?? 'on') !== 'off';
if (!UPLOAD_QUALITY_GATE) {
  console.warn('[api] UPLOAD_QUALITY_GATE=off: accepting all uploads without face validation (dev only)');
}

const UPLOAD_STRICT_GATE = UPLOAD_QUALITY_GATE && (process.env.UPLOAD_STRICT_GATE ?? 'on') !== 'off';

const DETECT_CONCURRENCY = Number.parseInt(process.env.UPLOAD_DETECT_CONCURRENCY, 10) || 2;

const UPLOAD_MODERATION = (process.env.UPLOAD_MODERATION ?? 'on') !== 'off';
const MODERATION_FAIL_OPEN = (process.env.UPLOAD_MODERATION_FAIL_OPEN ?? 'true') !== 'false';
if (UPLOAD_MODERATION && MODERATION_FAIL_OPEN) {
  console.log('[api] content moderation ON (fail-open on classifier errors)');
} else if (UPLOAD_MODERATION) {
  console.log('[api] content moderation ON (fail-closed on classifier errors)');
} else {
  console.warn('[api] UPLOAD_MODERATION=off: not screening uploads for unsafe content (dev only)');
}

async function mapWithLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  const size = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

const legacyJwtSecret = !JWT_SECRET && process.env.ADMIN_JWT_SECRET;
const jwtSecret = JWT_SECRET || process.env.ADMIN_JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ? JWT_EXPIRES_IN : process.env.ADMIN_JWT_EXPIRES_IN || JWT_EXPIRES_IN;
const jwtCookieExpiresIn = Number(process.env.JWT_COOKIE_EXPIRES_IN || process.env.ADMIN_COOKIE_EXPIRES_DAYS || JWT_COOKIE_EXPIRES_IN) || 30;
if (legacyJwtSecret) console.warn('[api] ADMIN_JWT_SECRET is deprecated; set JWT_SECRET (and JWT_EXPIRES_IN, JWT_COOKIE_EXPIRES_IN)');

const mongoose = await connectMongo(MONGODB_URI);
console.log('[api] connected to MongoDB');

const stripe = new Stripe(STRIPE_SECRET_KEY);

const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';
if (!INTERNAL_API_KEY) console.warn('[api] INTERNAL_API_KEY is unset; /checkout will refuse every request');
function internalOnly(req, res, next) {
  const key = req.headers['x-internal-key'];
  if (!INTERNAL_API_KEY || typeof key !== 'string' || key.length !== INTERNAL_API_KEY.length) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  if (!timingSafeEqual(Buffer.from(key), Buffer.from(INTERNAL_API_KEY))) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  return next();
}
const MODEL_REUSE_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;
const FREE_TIER_IDS = TIERS.filter(isFreeTier).map((t) => t.id);

const emailClient = BREVO_API_KEY
  ? createEmailClient({ apiKey: BREVO_API_KEY, sender: BREVO_SENDER })
  : null;

const adminStorage = (() => {
  try {
    return createStorage();
  } catch (err) {
    console.warn(`[api] storage not configured; admin delete will skip R2 cleanup: ${err.message}`);
    return null;
  }
})();

const deleteTrainedModel = process.env.REPLICATE_API_TOKEN
  ? (await import('./pipeline/replicateClient.js')).deleteTrainedModel
  : null;

const connection = createRedisConnection(REDIS_URL);
const orderPipeline = new Queue(QUEUE_NAMES.ORDER_PIPELINE, { connection });

// makes the enqueue idempotent: the same order can never be queued twice.
function pipelineJobOpts(orderId, priority) {
  return {
    jobId: orderId,
    priority,
    // idempotent (never retrains, never regenerates a started slot), so extra
    attempts: 5,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: true,
  };
}

function toPublicOrder(order) {
  const isDelivered = order.status === ORDER_STATES.DELIVERED;
  const isGenerating = order.status === ORDER_STATES.GENERATING;

  const resultImageUrls = isDelivered
    ? (order.deliveredImageUrls?.length ? order.deliveredImageUrls : (order.resultImageUrls ?? []))
    : [];

  const generatedCount = isGenerating ? (order.resultImageUrls?.length ?? 0) : 0;
  const totalCount = isGenerating ? (order.replicate?.generationIds?.length ?? 0) : 0;

  return {
    orderId: order._id.toString(),
    status: order.status,
    product: order.product ?? 'headshots',
    selectedLooks: order.selectedLooks ?? [],
    selectedAttire: order.selectedAttire ?? [],
    resultImageUrls,
    generatedCount,
    totalCount,
    createdAt: order.createdAt,
    paidAt: order.paidAt ?? null,
    deliveredAt: order.deliveredAt ?? null,
    failed: order.status === ORDER_STATES.FAILED,
    refunded: Boolean(order.refundedAt),
  };
}

const GATE_CACHE_TTL_S = Number.parseInt(process.env.UPLOAD_GATE_CACHE_TTL, 10) || 3600;

async function detectImageAll(url) {
  const [face, moderation, strict] = await Promise.all([
    UPLOAD_QUALITY_GATE
      ? detectFaces(url).catch((err) => {
          console.error(`[api] face detection failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'face-detection' });
          return { faceCount: 0, maxFaceBoxRatio: 0, error: true };
        })
      : Promise.resolve(null),
    UPLOAD_MODERATION
      ? moderateImage(url).catch((err) => {
          console.error(`[api] moderation failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'moderation' });
          return { safe: MODERATION_FAIL_OPEN, score: null, reason: MODERATION_REASON, errored: true };
        })
      : Promise.resolve({ safe: true }),
    UPLOAD_STRICT_GATE
      ? assessPhoto(url).catch((err) => {
          console.error(`[api] photo screen failed for ${url}: ${err.message}`);
          captureError(err, { route: 'orders/images', phase: 'photo-screen' });
          return { issue: null, errored: true };
        })
      : Promise.resolve({ issue: null }),
  ]);
  return { face, moderation, strict };
}

async function cachedDetect(url) {
  const key = `gate:v2:${url}`;
  try {
    const hit = await connection.get(key);
    if (hit) return JSON.parse(hit);
  } catch {
  }
  const res = await detectImageAll(url);
  const clean = !res.face?.error && !res.moderation?.errored && !res.strict?.errored;
  if (clean) {
    try {
      await connection.set(key, JSON.stringify(res), 'EX', GATE_CACHE_TTL_S);
    } catch {
    }
  }
  return res;
}

async function runUploadGate(uploadedImageUrls, { enforceCount = true } = {}) {
  if (!(UPLOAD_QUALITY_GATE || UPLOAD_MODERATION)) return null;

  const nErr = enforceCount ? countError(uploadedImageUrls.length) : null;
  if (nErr) {
    return { status: 422, body: { error: 'quality_gate', countError: nErr, failures: [], rules: QUALITY } };
  }

  const results = await mapWithLimit(uploadedImageUrls, DETECT_CONCURRENCY, async (url, index) => {
    const { face, moderation, strict } = await cachedDetect(url);
    return { index, url, face, moderation, strict };
  });

  if (UPLOAD_MODERATION) {
    const unsafe = results
      .filter((r) => !r.moderation.safe)
      .map((r) => ({ index: r.index, reason: r.moderation.reason || MODERATION_REASON }));
    if (unsafe.length) {
      return { status: 422, body: { error: 'content_moderation', failures: unsafe } };
    }
  }

  if (UPLOAD_QUALITY_GATE) {
    const failures = evaluateImages(
      results.map((r) => ({ index: r.index, url: r.url, ...r.face, qualityIssue: r.strict?.issue }))
    );
    if (failures.length) {
      return { status: 422, body: { error: 'quality_gate', failures, rules: QUALITY } };
    }
  }

  return null;
}

function adminAuthorized(req) {
  if (!ADMIN_TOKEN) return false;
  const provided =
    (req.headers.authorization || '').replace(/^Bearer\s+/i, '') ||
    req.headers['x-admin-token'] ||
    '';
  const a = Buffer.from(String(provided));
  const b = Buffer.from(ADMIN_TOKEN);
  return a.length === b.length && timingSafeEqual(a, b);
}

const app = express();

const TRUST_PROXY_HOPS = Number.parseInt(process.env.TRUST_PROXY_HOPS, 10);
app.set('trust proxy', Number.isFinite(TRUST_PROXY_HOPS) ? TRUST_PROXY_HOPS : 1);

const { globalLimiter, presignLimiter, gateLimiter, checkoutLimiter } = createRateLimiters(RATE_LIMITS);

app.use(cors({ origin: WEB_BASE_URL, credentials: true }));

app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error(`[api] webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.status(200).json({ received: true });
  }

  const session = event.data.object;

  try {
    const order = await Order.findOne({ stripeSessionId: session.id });
    if (!order) {
      console.error(
        `[api] webhook: no order for checkout session ${session.id} (should not happen)`
      );
      return res.status(200).json({ received: true });
    }

    const orderId = order._id.toString();

    // b. Idempotent + atomic. Money figures come from STRIPE, never the client.
    try {
      await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
        amountPaidCents: session.amount_total,
        stripePaymentIntentId: session.payment_intent,
      });
    } catch (err) {
      if (err instanceof OrderTransitionConflictError) {
        console.log(
          `[api] webhook: order ${orderId} already processed (Stripe retry), skipping enqueue`
        );
        return res.status(200).json({ received: true });
      }
      throw err;
    }

    const tier = getTier(order.tier);
    await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId, tier.priority));
    console.log(`[api] webhook: order ${orderId} PAID and enqueued`);

    if (emailClient) {
      const token = order.publicToken ? `&t=${order.publicToken}` : '';
      emailClient
        .sendPaidEmail({
          to: order.customerEmail,
          resultsUrl: `${WEB_BASE_URL}/success?orderId=${orderId}${token}`,
          orderId,
          planLabel: tier.label,
          deliverCount: order.deliverCount ?? tier.deliverCount,
          product: order.product,
        })
        .catch((err) => {
          console.error(`[api] webhook: paid email for ${orderId} failed:`, err.message);
          captureError(err, { route: 'webhooks/stripe', stage: 'paid-email' });
        });
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('[api] webhook handler error:', err);
    captureError(err, { route: 'webhooks/stripe' });
    return res.status(500).json({ error: err.message });
  }
});

app.use(express.json());

app.use(cookieParser());

app.get('/health', (req, res) => {
  res.json({ ok: true });
});

app.use(globalLimiter);

const admin = createAdminSubsystem({
  db: mongoose.connection,
  jwtSecret,
  jwtExpiresIn,
  cookieExpiresInDays: jwtCookieExpiresIn,
  nodeEnv: NODE_ENV,
  adminToken: ADMIN_TOKEN,
  isTokenAuthorized: adminAuthorized,
});
const { guard: adminGuard, restrictTo } = admin;

app.use('/auth', admin.authRouter);
app.use('/api/auth', admin.authRouter);
if (admin.authEnabled) {
  console.log('[api] admin auth ON (cookie sessions)');
} else {
  console.warn('[api] JWT_SECRET unset: admin auth disabled (/auth returns 503)');
}

app.post('/uploads/presign', presignLimiter, async (req, res) => {
  try {
    const { files } = req.body ?? {};
    if (!Array.isArray(files) || files.length === 0) {
      return res.status(400).json({ error: 'files must be a non-empty array' });
    }
    if (files.length > MAX_UPLOAD_FILES) {
      return res.status(400).json({ error: `at most ${MAX_UPLOAD_FILES} files` });
    }
    for (const f of files) {
      if (!f || typeof f.contentType !== 'string' || !f.contentType.startsWith('image/')) {
        return res.status(400).json({ error: 'each file needs an image/* contentType' });
      }
    }

    const storage = createStorage();
    const uploads = await Promise.all(
      files.map(async (f) => {
        const raw = String(f.filename || 'photo').replace(/[^a-zA-Z0-9._-]/g, '_');
        const ext = IMAGE_EXT[String(f.contentType).toLowerCase()] || 'jpg';
        const safeName = HAS_IMAGE_EXT.test(raw) ? raw : `${raw}.${ext}`;
        const key = `uploads/${randomUUID()}/${safeName}`;
        const uploadUrl = await storage.presignPut(key, f.contentType);
        return { uploadUrl, publicUrl: storage.publicUrl(key), key, contentType: f.contentType };
      })
    );

    return res.json({ uploads });
  } catch (err) {
    console.error('[api] POST /uploads/presign failed:', err);
    captureError(err, { route: 'uploads/presign' });
    return res.status(500).json({ error: err.message });
  }
});

app.post('/uploads/gate', gateLimiter, async (req, res) => {
  try {
    const { uploadedImageUrls } = req.body ?? {};
    if (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }
    const normalized = adminStorage
      ? await Promise.all(uploadedImageUrls.map((u) => normalizeUpload(adminStorage, u).catch(() => u)))
      : uploadedImageUrls;
    const gate = await runUploadGate(normalized, { enforceCount: false });
    if (gate) return res.status(gate.status).json(gate.body);
    return res.json({ ok: true, urls: normalized });
  } catch (err) {
    console.error('[api] POST /uploads/gate failed:', err);
    captureError(err, { route: 'uploads/gate' });
    return res.status(500).json({ error: 'gate failed' });
  }
});

app.post('/checkout', checkoutLimiter, internalOnly, async (req, res) => {
  try {
    const {
      email,
      userId,
      selectedLooks,
      selectedAttire,
      uploadedImageUrls,
      reuseFromOrderId,
      gender,
      ageRange,
      race,
      facialHair,
      build,
      height,
      tier,
      product: productIn,
    } = req.body ?? {};
    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }
    if (!userId || !mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ error: 'userId is required' });
    }
    if (productIn != null && productIn !== '' && !isValidProduct(productIn)) {
      return res.status(400).json({ error: 'product is not a known product' });
    }
    const product = productOf(productIn);
    if (!Array.isArray(selectedLooks) || selectedLooks.length === 0) {
      return res.status(400).json({ error: 'selectedLooks must be a non-empty array' });
    }
    if (!Array.isArray(selectedAttire) || selectedAttire.length === 0) {
      return res.status(400).json({ error: 'selectedAttire must be a non-empty array' });
    }
    const reusing = reuseFromOrderId != null && reuseFromOrderId !== '';
    if (!reusing && (!Array.isArray(uploadedImageUrls) || uploadedImageUrls.length === 0)) {
      return res.status(400).json({ error: 'uploadedImageUrls must be a non-empty array' });
    }
    let source = null;
    if (reusing) {
      if (!mongoose.isValidObjectId(reuseFromOrderId)) {
        return res.status(400).json({ error: 'reuseFromOrderId is not a valid order id' });
      }
      source = await Order.findOne({ _id: reuseFromOrderId, userId });
      const trained = source?.replicate?.trainedModelVersion;
      const at = source?.deliveredAt || source?.paidAt || source?.createdAt;
      if (!source || !trained || !at || Date.now() - new Date(at).getTime() > MODEL_REUSE_MAX_AGE_MS) {
        return res.status(400).json({ error: 'That order has no photos we can reuse' });
      }
    }
    if (!selectedLooks.every((id) => isValidLook(id, product))) {
      return res.status(400).json({ error: 'selectedLooks contains an unknown look id' });
    }
    if (!selectedAttire.every((id) => isValidAttire(id, product))) {
      return res.status(400).json({ error: 'selectedAttire contains an unknown attire id' });
    }
    if (!isValidGender(gender)) {
      return res.status(400).json({ error: 'gender is required and must be a known option' });
    }
    if (!isValidAgeRange(ageRange)) {
      return res.status(400).json({ error: 'ageRange is required and must be a known option' });
    }
    if (race != null && race !== '' && !isValidRace(race)) {
      return res.status(400).json({ error: 'race contains an unknown option' });
    }
    if (facialHair != null && facialHair !== '' && !isValidFacialHair(facialHair)) {
      return res.status(400).json({ error: 'facialHair contains an unknown option' });
    }
    if (build != null && build !== '' && !isValidBuild(build)) {
      return res.status(400).json({ error: 'build contains an unknown option' });
    }
    if (height != null && height !== '' && !isValidHeight(height)) {
      return res.status(400).json({ error: 'height contains an unknown option' });
    }
    if (tier != null && tier !== '' && !isValidTier(tier)) {
      return res.status(400).json({ error: 'tier is not a known pricing tier' });
    }
    const selectedTier = getTier(tier || DEFAULT_TIER);
    if (selectedTier.product !== product) {
      return res.status(400).json({ error: 'tier does not belong to this product' });
    }
    if (selectedTier.lookCount != null && selectedLooks.length > selectedTier.lookCount) {
      return res.status(400).json({
        error: `${selectedTier.label} includes up to ${selectedTier.lookCount} backgrounds`,
      });
    }
    if (selectedTier.attireCount != null && selectedAttire.length > selectedTier.attireCount) {
      return res.status(400).json({
        error: `${selectedTier.label} includes up to ${selectedTier.attireCount} outfits`,
      });
    }
    const free = isFreeTier(selectedTier);
    if (free && (await Order.exists({ userId, tier: { $in: FREE_TIER_IDS } }))) {
      return res.status(409).json({ error: 'You have already used your free set' });
    }

    if (!reusing) {
      const nErr = countError(uploadedImageUrls.length);
      if (nErr) {
        return res.status(422).json({ error: 'quality_gate', countError: nErr, failures: [], rules: QUALITY });
      }
    }

    const newOrderId = new mongoose.Types.ObjectId();
    let reusedSelfies = null;
    if (reusing) {
      if (!adminStorage) return res.status(500).json({ error: 'Storage is not configured' });
      reusedSelfies = await resolveReusableSelfies(adminStorage, source, newOrderId.toString());
      if (!reusedSelfies) {
        return res.status(409).json({ error: 'We no longer have the photos from that order. Please upload again.' });
      }
    }

    const order = await Order.create({
      _id: newOrderId,
      customerEmail: email,
      userId,
      publicToken: randomUUID().replace(/-/g, ''),
      selectedLooks,
      selectedAttire,
      gender,
      ageRange,
      race: race || undefined,
      facialHair: facialHair || undefined,
      build: build || undefined,
      height: height || undefined,
      uploadedImageUrls: reusing ? reusedSelfies : uploadedImageUrls,
      reuseFromOrderId: reusing ? source._id : undefined,
      replicate: reusing
        ? { trainedModelVersion: source.replicate.trainedModelVersion, weightsUrl: source.replicate.weightsUrl }
        : undefined,
      product,
      tier: selectedTier.id,
      deliverCount: selectedTier.deliverCount,
      generateCount: selectedTier.generateCount,
    });
    const orderId = order._id.toString();
    const successUrl = `${WEB_BASE_URL}/success?orderId=${orderId}&t=${order.publicToken}`;

    // idempotent guard, so a double submit cannot enqueue twice.
    if (free) {
      await transitionOrder(orderId, ORDER_STATES.AWAITING_PAYMENT, ORDER_STATES.PAID, {
        amountPaidCents: 0,
      });
      await orderPipeline.add('process-order', { orderId }, pipelineJobOpts(orderId, selectedTier.priority));
      console.log(`[api] order ${orderId} free set started for user ${userId}`);
      if (emailClient) {
        emailClient
          .sendPaidEmail({
            to: email,
            resultsUrl: successUrl,
            orderId,
            planLabel: selectedTier.label,
            deliverCount: selectedTier.deliverCount,
            product,
            free: true,
          })
          .catch((err) => {
            console.error(`[api] free set email for ${orderId} failed:`, err.message);
            captureError(err, { route: 'checkout', stage: 'free-email' });
          });
      }
      return res.status(201).json({ orderId, checkoutUrl: successUrl, free: true });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: selectedTier.priceCents,
            product_data: {
              name: `Picturesk ${product === 'dating' ? 'dating photos' : 'headshots'} (${selectedTier.label}, ${selectedTier.deliverCount} photos)`,
            },
          },
        },
      ],
      metadata: { orderId },
      success_url: `${WEB_BASE_URL}/success?orderId=${orderId}&t=${order.publicToken}`,
      cancel_url: `${WEB_BASE_URL}/${product === 'dating' ? 'ai-dating-photos' : 'ai-headshot-generator'}/review`,
    });

    // The session id is our idempotency anchor: the webhook finds the order by it.
    order.stripeSessionId = session.id;
    await order.save();

    return res.status(201).json({ orderId, checkoutUrl: session.url });
  } catch (err) {
    console.error('[api] POST /checkout failed:', err);
    captureError(err, { route: 'checkout' });
    return res.status(500).json({ error: err.message });
  }
});

function orderAuthorized(req, order) {
  if (!order.publicToken) return true;
  const provided = String(req.query.t || '');
  const a = Buffer.from(provided);
  const b = Buffer.from(order.publicToken);
  return a.length === b.length && timingSafeEqual(a, b);
}

app.get('/orders/:id', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    if (!orderAuthorized(req, order)) return res.status(404).json({ error: 'order not found' });
    return res.json(toPublicOrder(order));
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

app.get('/orders/:id/download/:index', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    if (!orderAuthorized(req, order)) return res.status(404).json({ error: 'order not found' });

    const urls =
      order.status === ORDER_STATES.DELIVERED
        ? order.deliveredImageUrls?.length
          ? order.deliveredImageUrls
          : (order.resultImageUrls ?? [])
        : [];

    const index = Number.parseInt(req.params.index, 10);
    if (!Number.isInteger(index) || index < 0 || index >= urls.length) {
      return res.status(404).json({ error: 'no such image' });
    }

    const upstream = await fetch(urls[index]);
    if (!upstream.ok || !upstream.body) {
      return res
        .status(502)
        .json({ error: 'could not fetch image', upstreamStatus: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const contentLength = upstream.headers.get('content-length');
    const ext = (IMAGE_EXT[contentType.split(';')[0].trim()] || 'jpg').replace(/[^a-z0-9]/gi, '');

    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="picturesk-headshot-${index + 1}.${ext}"`
    );
    if (contentLength) res.setHeader('Content-Length', contentLength);
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const nodeStream = Readable.fromWeb(upstream.body);
    nodeStream.on('error', (err) => {
      captureError(err, { route: 'download', orderId: req.params.id });
      if (!res.headersSent) res.status(502).json({ error: 'could not read image' });
      else res.destroy(err);
    });
    nodeStream.pipe(res);
  } catch (err) {
    captureError(err, { route: 'download', orderId: req.params.id });
    if (!res.headersSent) return res.status(400).json({ error: err.message });
    return res.destroy(err);
  }
});

app.get('/orders/:id/download-all', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'order not found' });
    if (!orderAuthorized(req, order)) return res.status(404).json({ error: 'order not found' });

    const urls =
      order.status === ORDER_STATES.DELIVERED
        ? order.deliveredImageUrls?.length
          ? order.deliveredImageUrls
          : (order.resultImageUrls ?? [])
        : [];
    if (urls.length === 0) return res.status(404).json({ error: 'no images to download' });

    let failure = null;
    const files = await mapWithLimit(urls, 6, async (url, i) => {
      const upstream = await fetch(url);
      if (!upstream.ok) {
        failure = failure ?? { index: i, status: upstream.status };
        return null;
      }
      const contentType = (upstream.headers.get('content-type') || 'image/jpeg')
        .split(';')[0]
        .trim();
      const ext = (IMAGE_EXT[contentType] || 'jpg').replace(/[^a-z0-9]/gi, '');
      const buf = Buffer.from(await upstream.arrayBuffer());
      return { name: `picturesk-headshot-${i + 1}.${ext}`, buf };
    });
    if (failure) {
      return res
        .status(502)
        .json({ error: 'could not fetch image', imageIndex: failure.index, upstreamStatus: failure.status });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="picturesk-headshots.zip"');
    res.setHeader('Cache-Control', 'private, max-age=3600');

    const zip = new ZipArchive({ zlib: { level: 0 } }); 
    zip.on('error', (err) => {
      captureError(err, { route: 'download-all', orderId: req.params.id });
      if (!res.headersSent) res.status(500).json({ error: 'could not build zip' });
      else res.destroy(err);
    });
    zip.pipe(res);
    for (const f of files) zip.append(f.buf, { name: f.name });
    await zip.finalize();
  } catch (err) {
    captureError(err, { route: 'download-all', orderId: req.params.id });
    if (!res.headersSent) return res.status(400).json({ error: err.message });
    return res.destroy(err);
  }
});

const adminActionsRouter = createAdminActionsRouter({
  guard: adminGuard,
  restrictTo,
  stripe,
  orderPipeline,
  pipelineJobOpts,
  emailClient,
  storage: adminStorage,
  deleteTrainedModel,
  webBaseUrl: WEB_BASE_URL,
});
const adminDataRouter = createAdminDataRouter({ guard: adminGuard, restrictTo });

app.use('/admin', adminActionsRouter);
app.use('/admin', adminDataRouter);
app.use('/api/admin', adminActionsRouter);
app.use('/api/admin', adminDataRouter);

app.use('/admin-users', admin.adminUsersRouter);
app.use('/api/admin-users', admin.adminUsersRouter);

const sharedAuth = { protect: adminGuard, restrictTo };

const blogRouter = createBlogRouter({
  db: mongoose.connection,
  auth: sharedAuth,
  imageStorage: createCloudinaryStorage({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET,
    logger: console,
    folder: 'picturesk/blog',
  }),
  anthropicApiKey: ANTHROPIC_API_KEY,
});
const blogTagRouter = createBlogTagRouter({ db: mongoose.connection, auth: sharedAuth });

const affiliatesRouter = createAffiliatesRouter({ db: mongoose.connection, auth: sharedAuth });

app.use('/blogs', blogRouter);
app.use('/blog-tags', blogTagRouter);
app.use('/affiliates', affiliatesRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/blog-tags', blogTagRouter);
app.use('/api/affiliates', affiliatesRouter);

if (sentryEnabled) {
  Sentry.setupExpressErrorHandler(app);
}

app.use((err, req, res, _next) => {
  if (err?.name === 'ValidationError' && err.errors) {
    const message = Object.values(err.errors).map((e) => e.message).join('. ');
    return res.status(400).json({ status: 'fail', message });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ status: 'fail', message: `Invalid ${err.path}` });
  }

  const statusCode = err.isOperational ? err.statusCode : 500;
  const status = err.status || (`${statusCode}`.startsWith('4') ? 'fail' : 'error');
  if (!err.isOperational) {
    console.error('[api] unhandled route error:', err);
    captureError(err, { route: req.originalUrl });
  }
  res.status(statusCode).json({
    status,
    message: err.isOperational ? err.message : 'Something went wrong',
  });
});

app.listen(PORT, () => {
  console.log(`[api] listening on :${PORT}`);
});

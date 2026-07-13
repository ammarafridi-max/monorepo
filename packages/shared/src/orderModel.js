import mongoose from 'mongoose';
import { ORDER_STATES } from './orderStates.js';

/**
 * Mongoose schema + model for an Order.
 *
 * Phase 0: schema only. This intentionally has NO transition methods and NO
 * business logic. It defines what an order is so every service agrees on the
 * shape. Transitions are guarded elsewhere via canTransition() from orderStates.
 */

const { Schema } = mongoose;

const replicateSchema = new Schema(
  {
    trainingId: String,
    trainedModelVersion: String,
    generationIds: [String],
  },
  { _id: false }
);

const errorSchema = new Schema(
  {
    stage: String,
    message: String,
    at: Date,
  },
  { _id: false }
);

// One identity-fidelity score per generated CANDIDATE, index-aligned with
// resultImageUrls. Self-describing ({ imageUrl, score }) so a later API/UI can
// show why a shot was chosen and audit the cull. Higher score == more like the
// customer's real selfies. Written incrementally during selection.
const candidateScoreSchema = new Schema(
  {
    imageUrl: String,
    score: Number,
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATES),
      default: ORDER_STATES.AWAITING_PAYMENT,
      index: true,
    },

    customerEmail: { type: String, required: true },

    // Optional owner. Anonymous orders (the default) leave this null; a logged-in
    // checkout sets it, and signup/login back-links past orders by email. Never
    // required: buying does not need an account.
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    // Integer cents, never a float. Taken straight from Stripe amount_total.
    // Divide by 100 only at display time.
    amountPaidCents: Number,

    // Idempotency anchor: one Stripe Checkout session maps to at most one order.
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,

    // The customer's choices (catalog ids from @picturesk/shared catalog.js),
    // captured at checkout. The worker turns these into generation prompts via
    // buildPrompts, so they are part of the order contract, not just display state.
    selectedLooks: [String],
    selectedAttire: [String],

    // Subject demographics (catalog ids from @picturesk/shared catalog.js),
    // captured at checkout. The worker feeds these to buildSubject to lead every
    // generation prompt with the right subject (e.g. "a woman in their thirties"),
    // tightening identity so a weak seed drifts less. gender + ageRange are asked
    // on the select step; race is optional. All optional here so a legacy order
    // falls back to a generic "a person". facialHair (optional) names the beard in
    // the prompt so it does not drift toward the base model's clean-shaven prior.
    gender: String,
    ageRange: String,
    race: String,
    facialHair: String,
    // Facial hair inferred from the reference selfie (a vision model) when the
    // customer left facialHair blank. Used by the PuLID backend to describe the
    // beard in the prompt so it renders the real one, not a generic short beard.
    derivedFacialHair: String,

    // The customer's photos, uploaded direct-to-R2 BEFORE payment and passed to
    // /checkout (the order is created already carrying them).
    uploadedImageUrls: [String],

    replicate: replicateSchema,

    // The RAW candidate set: every image the GENERATING stage produced
    // (GENERATE_COUNT of them, more than we deliver). Selection scores these and
    // picks the best DELIVER_COUNT into deliveredImageUrls. Kept whole for audit.
    resultImageUrls: [String],

    // Per-candidate identity scores, index-aligned with resultImageUrls.
    candidateScores: [candidateScoreSchema],

    // Face-swapped delivered images, when the identity-lock step is enabled. The
    // customer's real face swapped onto each SELECTED headshot (index-aligned with
    // the selected set), persisted per slot so the swap pass is resumable. When set,
    // deliveredImageUrls points at THESE, not the raw generated candidates.
    swappedImageUrls: [String],

    // Realism-enhanced delivered images (clarity-upscaler: skin texture + eyes),
    // the FINAL polish applied to the selected/swapped set, persisted per slot so
    // the enhance pass is resumable. When set, deliveredImageUrls points at THESE.
    enhancedImageUrls: [String],

    // The CHOSEN delivered subset: the top DELIVER_COUNT candidates by identity
    // score, best-first. This is the idempotency anchor for SELECTION
    // (receipt-before-acting, same pattern as deliveredEmailSentAt / refundedAt):
    // once set, a worker restart re-entering GENERATING must NOT re-score or
    // re-select. The delivery email and the order's public results must read
    // THIS, not the full resultImageUrls candidate list.
    deliveredImageUrls: [String],

    // Set the moment the delivery email is successfully sent. The idempotency
    // anchor for delivery: a worker restart after DELIVERED must not email
    // twice, so we only send when this is unset and stamp it on success. Closes
    // the "DELIVERED assumes email sent" gap without adding a new state.
    deliveredEmailSentAt: Date,

    // Set the moment a refund is successfully issued for a FAILED order. The
    // idempotency anchor for refunds (same receipt-before-acting pattern as the
    // email): only refund when this is unset, stamp it on success. Closes the
    // "FAILED can't tell if refund happened" gap.
    refundedAt: Date,

    // Margin tracking: what this order cost us in external compute.
    // Integer cents, never a float. Divide by 100 only at display time.
    computeCostCents: { type: Number, default: 0 },

    error: errorSchema,

    // Transition timestamps, stamped as the order moves through its lifecycle.
    paidAt: Date,
    trainingStartedAt: Date,
    generatingStartedAt: Date,
    deliveredAt: Date,
    failedAt: Date,
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

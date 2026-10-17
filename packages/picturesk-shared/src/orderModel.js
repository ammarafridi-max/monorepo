import mongoose from 'mongoose';
import { ORDER_STATES } from './orderStates.js';
import { DEFAULT_TIER } from './pricing.js';
import { DEFAULT_PRODUCT } from './products.js';


const { Schema } = mongoose;

const replicateSchema = new Schema(
  {
    trainingId: String,
    trainedModelVersion: String,
    weightsUrl: String,
    generationIds: [String],
    trainingRestarts: { type: Number, default: 0 },
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

    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    reuseFromOrderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },

    amountPaidCents: Number,

    product: { type: String, default: DEFAULT_PRODUCT, index: true },
    tier: { type: String, default: DEFAULT_TIER, index: true },
    deliverCount: Number,
    generateCount: Number,

    publicToken: { type: String, index: true },

    // Idempotency anchor: one Stripe Checkout session maps to at most one order.
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,

    selectedLooks: [String],
    selectedAttire: [String],

    gender: String,
    build: String,
    height: String,
    ageRange: String,
    race: String,
    facialHair: String,
    derivedFacialHair: String,

    uploadedImageUrls: [String],

    replicate: replicateSchema,

    resultImageUrls: [String],

    candidateScores: [candidateScoreSchema],

    swappedImageUrls: [String],

    enhancedImageUrls: [String],

    persistedImageUrls: [String],

    // score, best-first. This is the idempotency anchor for SELECTION
    deliveredImageUrls: [String],

    // Set the moment the delivery email is successfully sent. The idempotency
    deliveredEmailSentAt: Date,

    // idempotency anchor for refunds (same receipt-before-acting pattern as the
    refundedAt: Date,

    computeCostCents: { type: Number, default: 0 },

    error: errorSchema,

    paidAt: Date,
    trainingStartedAt: Date,
    generatingStartedAt: Date,
    deliveredAt: Date,
    failedAt: Date,
  },
  { timestamps: true }
);

export const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

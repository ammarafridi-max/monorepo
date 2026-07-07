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

const orderSchema = new Schema(
  {
    status: {
      type: String,
      enum: Object.values(ORDER_STATES),
      default: ORDER_STATES.AWAITING_PAYMENT,
      index: true,
    },

    customerEmail: { type: String, required: true },

    // Integer cents, never a float. Taken straight from Stripe amount_total.
    // Divide by 100 only at display time.
    amountPaidCents: Number,

    // Idempotency anchor: one Stripe Checkout session maps to at most one order.
    stripeSessionId: { type: String, unique: true, sparse: true },
    stripePaymentIntentId: String,

    uploadedImageUrls: [String],

    replicate: replicateSchema,

    resultImageUrls: [String],

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

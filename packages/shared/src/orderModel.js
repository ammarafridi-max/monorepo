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

    uploadedImageUrls: [String],

    replicate: replicateSchema,

    resultImageUrls: [String],

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

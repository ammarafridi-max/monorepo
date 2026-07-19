import mongoose from 'mongoose';

const StripeWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String },
    productType: { type: String },
    sessionId: { type: String },
    createdAtStripe: { type: Date },
    handlerSucceeded: { type: Boolean, default: false },
    // Set when a delivery claims the event to run its handler; cleared on
    // finish/failure. A stale (crashed) claim is reclaimable after a timeout.
    processingAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export default StripeWebhookEventSchema;

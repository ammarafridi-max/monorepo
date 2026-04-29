import mongoose from 'mongoose';

const StripeWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    type: { type: String },
    productType: { type: String },
    sessionId: { type: String },
    createdAtStripe: { type: Date },
    handlerSucceeded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default StripeWebhookEventSchema;

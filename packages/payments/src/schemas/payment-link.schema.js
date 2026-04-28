import mongoose from 'mongoose';

const PaymentLinkSchema = new mongoose.Schema(
  {
    // Stripe references
    stripePaymentLinkId: { type: String, required: true, unique: true, index: true },
    stripePriceId: { type: String, required: true },
    stripeProductId: { type: String },
    url: { type: String, required: true },

    // Amount stored in major units (e.g. 49.50). Currency is lowercase ISO-4217.
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },

    // Customer-facing name (shown on the Stripe checkout page)
    productName: { type: String, trim: true, default: '' },

    // Admin-facing notes (what is this link for?)
    description: { type: String, trim: true, default: '' },

    // Auditing
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'AdminUser' },
      name: { type: String },
      email: { type: String },
    },

    // Lifecycle
    //   active   — link is live on Stripe, payments can be made
    //   paid     — a customer has completed payment (terminal state)
    //   inactive — admin disabled the link on Stripe; payments are blocked
    //   expired  — reserved for future automatic expiry
    status: {
      type: String,
      enum: ['active', 'paid', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
    paidAt: { type: Date },
    paidByName: { type: String },
    paidByEmail: { type: String },

    // Stripe session that fulfilled the link
    sessionId: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true },
);

PaymentLinkSchema.index({ createdAt: -1 });
PaymentLinkSchema.index({ 'createdBy._id': 1, createdAt: -1 });

export default PaymentLinkSchema;

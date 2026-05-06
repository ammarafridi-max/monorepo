import mongoose from 'mongoose';

const PaymentLinkSchema = new mongoose.Schema(
  {
    // Stripe references
    stripePaymentLinkId: { type: String, required: true, unique: true, index: true },
    stripePriceId: { type: String, required: true },
    stripeProductId: { type: String },
    url: { type: String, required: true },

    // Total amount in major units (e.g. 150.00). For product-backed links
    // this equals unitAmount × quantity. Currency is lowercase ISO-4217.
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },

    // Customer-facing name (shown on the Stripe checkout page)
    productName: { type: String, trim: true, default: '' },

    // Line items the link charges for. A link can bundle multiple products
    // (one Stripe Payment Link, multiple `line_items` under the hood).
    //
    // Each entry has either a `productId` (referencing a catalog Product whose
    // Stripe Price is reused) or null `productId` for ad-hoc inline items.
    lineItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          default: null,
        },
        productName: { type: String, required: true },
        unitAmount: { type: Number, required: true, min: 0 },
        quantity: { type: Number, required: true, min: 1, default: 1 },
        stripePriceId: { type: String, required: true },
      },
    ],

    // Legacy single-product fields (kept populated when lineItems.length === 1
    // for backward compatibility with rows created before bundling existed).
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    unitAmount: { type: Number, min: 0, default: null },
    quantity: { type: Number, min: 1, default: 1 },

    // Admin-facing notes (what is this link for?)
    description: { type: String, trim: true, default: '' },

    // Auditing
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-user' },
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

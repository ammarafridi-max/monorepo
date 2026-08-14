import mongoose from 'mongoose';

const PaymentLinkSchema = new mongoose.Schema(
  {
    stripePaymentLinkId: { type: String, required: true, unique: true, index: true },
    stripePriceId: { type: String, required: true },
    stripeProductId: { type: String },
    url: { type: String, required: true },

    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },

    productName: { type: String, trim: true, default: '' },

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

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true,
    },
    unitAmount: { type: Number, min: 0, default: null },
    quantity: { type: Number, min: 1, default: 1 },

    description: { type: String, trim: true, default: '' },

    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-user' },
      name: { type: String },
      email: { type: String },
    },

    status: {
      type: String,
      enum: ['active', 'paid', 'inactive', 'expired'],
      default: 'active',
      index: true,
    },
    paidAt: { type: Date },
    paidByName: { type: String },
    paidByEmail: { type: String },

    sessionId: { type: String },
    transactionId: { type: String },
  },
  { timestamps: true },
);

PaymentLinkSchema.index({ createdAt: -1 });
PaymentLinkSchema.index({ 'createdBy._id': 1, createdAt: -1 });

export default PaymentLinkSchema;

import mongoose from 'mongoose';

/**
 * A reusable product/service in the admin's catalog.
 *
 * Each Product is backed by a single Stripe Price that can be referenced by
 * many Payment Links — letting an admin define a product once (e.g. "Hotel
 * Reservation, AED 75") and spawn per-customer Payment Links from it with
 * any chosen quantity.
 */
const ProductSchema = new mongoose.Schema(
  {
    // Customer-facing name (shown on the Stripe checkout page)
    name: { type: String, required: true, trim: true },

    // Admin-facing notes
    description: { type: String, trim: true, default: '' },

    // Per-unit price in major units (e.g. 75.00). Currency is lowercase ISO-4217.
    unitAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },

    // Stripe references
    stripePriceId: { type: String, required: true, unique: true, index: true },
    stripeProductId: { type: String },

    // Lifecycle — inactive products hide from the "create payment link" picker
    // but existing Payment Links that reference them keep working.
    isActive: { type: Boolean, default: true, index: true },

    // Auditing
    createdBy: {
      _id: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-user' },
      name: { type: String },
      email: { type: String },
    },
  },
  { timestamps: true },
);

ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isActive: 1, createdAt: -1 });

export default ProductSchema;

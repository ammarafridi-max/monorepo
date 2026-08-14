import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    description: { type: String, trim: true, default: '' },

    unitAmount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, lowercase: true, trim: true },

    stripePriceId: { type: String, required: true, unique: true, index: true },
    stripeProductId: { type: String },

    isActive: { type: Boolean, default: true, index: true },

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

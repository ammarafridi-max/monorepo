import mongoose from 'mongoose';

// Minimal schema for ref integrity — full CRUD lives in @travel-suite/affiliates (future)
const AffiliateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },
    affiliateId: { type: String, required: true, unique: true, index: true, immutable: true },
    commissionPercent: { type: Number, default: 25, min: 0, max: 100 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default AffiliateSchema;

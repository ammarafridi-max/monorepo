import mongoose from 'mongoose';

const AffiliateClickSchema = new mongoose.Schema(
  {
    affiliate: {
      type: mongoose.Schema.ObjectId,
      ref: 'affiliate',
      required: [true, 'Affiliate is required'],
    },
    affiliateId: {
      type: String,
      required: [true, 'Affiliate ID is required'],
      match: [/^\d{9}$/, 'Affiliate ID must be exactly 9 digits'],
    },
    date: {
      type: Date,
      required: [true, 'Click day is required'],
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true },
);

AffiliateClickSchema.index({ affiliate: 1, date: 1 }, { unique: true });
AffiliateClickSchema.index({ date: -1 });

export default AffiliateClickSchema;

import mongoose from 'mongoose';

export const PAYOUT_STATUSES = ['PENDING', 'PAID', 'VOID'];

const AffiliatePayoutSchema = new mongoose.Schema(
  {
    affiliate: {
      type: mongoose.Schema.ObjectId,
      ref: 'affiliate',
      required: [true, 'Affiliate is required'],
      index: true,
    },
    affiliateId: {
      type: String,
      required: [true, 'Affiliate ID is required'],
      match: [/^\d{9}$/, 'Affiliate ID must be exactly 9 digits'],
    },
    periodStart: { type: Date, required: [true, 'Period start is required'] },
    periodEnd: { type: Date, required: [true, 'Period end is required'] },
    currency: { type: String, default: null, uppercase: true, trim: true },
    commissionAmount: { type: Number, default: 0, min: 0 },
    revenueAmount: { type: Number, default: 0, min: 0 },
    orderCount: { type: Number, default: 0, min: 0 },
    absorbedRefundCount: { type: Number, default: 0, min: 0 },
    absorbedRefundAmount: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: PAYOUT_STATUSES, default: 'PENDING', index: true },
    paidAt: { type: Date, default: null },
    reference: { type: String, trim: true, default: null },
    note: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

AffiliatePayoutSchema.index({ affiliate: 1, periodStart: 1 }, { unique: true });
AffiliatePayoutSchema.index({ periodStart: -1 });

export default AffiliatePayoutSchema;

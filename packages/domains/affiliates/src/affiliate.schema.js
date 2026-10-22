import mongoose from 'mongoose';
import validator from 'validator';

const AFFILIATE_ID_REGEX = /^\d{9}$/;

const AffiliateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Affiliate name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Affiliate email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      validate: {
        validator: (value) => validator.isEmail(value || ''),
        message: 'Please provide a valid email address',
      },
    },
    affiliateId: {
      type: String,
      required: [true, 'Affiliate ID is required'],
      unique: true,
      index: true,
      immutable: true,
      match: [AFFILIATE_ID_REGEX, 'Affiliate ID must be exactly 9 digits'],
    },
    commissionPercent: {
      type: Number,
      required: [true, 'Commission percent is required'],
      default: 25,
      min: [0, 'Commission percent cannot be less than 0'],
      max: [100, 'Commission percent cannot be greater than 100'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

AffiliateSchema.statics.generateRandomAffiliateId = function () {
  const min = 100_000_000;
  const max = 999_999_999;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

AffiliateSchema.statics.generateUniqueAffiliateId = async function (maxRetries = 10) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidateId = this.generateRandomAffiliateId();
    const existing = await this.exists({ affiliateId: candidateId });
    if (!existing) return candidateId;
  }
  throw new Error('Unable to generate a unique affiliate ID after multiple retries');
};

export default AffiliateSchema;

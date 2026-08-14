import mongoose from 'mongoose';

const VisaQuerySchema = new mongoose.Schema(
  {
    nationality: { type: String, required: true, uppercase: true, trim: true, index: true },
    residence: { type: String, uppercase: true, trim: true, default: null },
    destination: { type: String, required: true, uppercase: true, trim: true, index: true },

    outcome: { type: String, required: true },
    source: { type: String, default: 'curated' },
    isServiced: { type: Boolean, default: false, index: true },
    wasFallback: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

VisaQuerySchema.index({ createdAt: -1 });
VisaQuerySchema.index({ destination: 1, nationality: 1 });

export default VisaQuerySchema;

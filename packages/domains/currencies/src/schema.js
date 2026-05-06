import mongoose from 'mongoose';

const CurrencySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true },
    rate: { type: Number, required: true, default: 1, min: 0 },
    isBaseCurrency: { type: Boolean, default: false },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

CurrencySchema.pre('save', function () {
  if (this.isBaseCurrency) this.rate = 1;
});

// Enforce only one base currency at the DB level
CurrencySchema.index(
  { isBaseCurrency: 1 },
  { unique: true, partialFilterExpression: { isBaseCurrency: true } },
);

export default CurrencySchema;

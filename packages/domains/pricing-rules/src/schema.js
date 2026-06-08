import mongoose from 'mongoose';

const PricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    pickupZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true }],
    dropoffZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone', required: true }],
    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true }],
    pricing: {
      oneWay: { type: Number, required: true, min: 0 },
      return: { type: Number, required: true, min: 0 },
    },
  },
  {
    collection: 'pricing-rules',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

PricingRuleSchema.pre(/^find/, function () {
  this.populate('vehicles', 'brand model class type pricing')
    .populate('pickupZones', 'name')
    .populate('dropoffZones', 'name');
});

export default PricingRuleSchema;

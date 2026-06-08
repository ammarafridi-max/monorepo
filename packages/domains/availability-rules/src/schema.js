import mongoose from 'mongoose';

const AvailabilityRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    pickupZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }],
    dropoffZones: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zone' }],
    vehicles: [
      {
        vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        available: { type: Boolean, default: true },
      },
    ],
    isActive: { type: Boolean, default: true },
  },
  {
    collection: 'availability-rules',
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

AvailabilityRuleSchema.pre(/^find/, function () {
  this.populate({ path: 'vehicles.vehicle' }).populate('pickupZones', 'name').populate('dropoffZones', 'name');
});

AvailabilityRuleSchema.index({ pickupZones: 1 });
AvailabilityRuleSchema.index({ dropoffZones: 1 });
AvailabilityRuleSchema.index({ isActive: 1 });
AvailabilityRuleSchema.index({ name: 1 });

export default AvailabilityRuleSchema;

import mongoose from 'mongoose';

const HotelBookingPricingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'hotel-booking', index: true },
    currency: { type: String, required: true, uppercase: true, trim: true },
    basePrice: { type: Number, required: true, min: 0 },
    perExtraNight: { type: Number, default: 0, min: 0 },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
  },
  { collection: 'hotel-booking-prices', timestamps: true },
);

HotelBookingPricingSchema.index({ key: 1, currency: 1 }, { unique: true });

export default HotelBookingPricingSchema;

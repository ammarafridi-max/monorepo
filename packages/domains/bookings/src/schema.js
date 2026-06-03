import mongoose from 'mongoose';

const BookingSchema = new mongoose.Schema(
  {
    trip: {
      pickup:     { label: String, lat: Number, lng: Number },
      dropoff:    { label: String, lat: Number, lng: Number },
      date:       { type: String, required: true },
      time:       { type: String, required: true },
      passengers: { type: Number, required: true },
      luggage:    { type: Number, default: 0 },
    },
    vehicle: {
      name:     { type: String, required: true },
      class:    String,
      price:    { amount: Number, currency: String },
      features: [String],
    },
    passenger: {
      firstName:       { type: String, required: true },
      lastName:        { type: String, required: true },
      email:           { type: String, required: true, lowercase: true, trim: true },
      countryCode:     String,
      phone:           { type: String, required: true },
      flightNumber:    { type: String, required: true, uppercase: true, trim: true },
      specialRequests: String,
    },
    status: {
      type:    String,
      enum:    ['pending_payment', 'paid', 'confirmed', 'completed', 'cancelled'],
      default: 'pending_payment',
    },
  },
  { timestamps: true },
);

export default BookingSchema;

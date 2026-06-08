import mongoose from 'mongoose';

const locationType = {
  type: String,
  enum: ['airport', 'location', 'hotel', 'residence', 'custom'],
  default: 'location',
};

const BookingSchema = new mongoose.Schema(
  {
    tripType: { type: String, enum: ['distance', 'hourly'], required: true },
    bookingRef: { type: String, required: true, uppercase: true, match: /^[A-Z0-9]{6}$/ },
    pickup: {
      id: { type: String },
      zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
      name: { type: String },
      address: { type: String },
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      type: locationType,
    },
    dropoff: {
      id: { type: String },
      zone: { type: mongoose.Schema.Types.ObjectId, ref: 'Zone' },
      name: { type: String },
      address: { type: String },
      lat: { type: Number },
      lng: { type: Number },
      type: locationType,
    },
    pickupDate: { type: String, required: true },
    pickupTime: { type: String, required: true },
    hoursBooked: { type: Number },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    bookingDetails: {
      firstName: { type: String, required: true, trim: true },
      lastName: { type: String, required: true, trim: true },
      email: { type: String, required: true, trim: true },
      phoneNumber: {
        code: { type: String },
        number: { type: Number },
      },
      flightNumber: { type: String },
      arrivalTime: { type: String },
      message: { type: String },
    },
    payment: {
      method: { type: String, enum: ['stripe', 'paypal', 'applePay', 'cash'], default: 'stripe' },
      status: { type: String, enum: ['paid', 'unpaid', 'failed', 'pending', 'refunded'], default: 'unpaid' },
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'AED' },
      transactionId: { type: String },
    },
    orderSummary: {
      baseFare: { type: Number, default: 0 },
      distanceCharge: { type: Number, default: 0 },
      hourlyCharge: { type: Number, default: 0 },
      addOns: { type: Number, default: 0 },
      taxes: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      currency: { type: String, default: 'AED' },
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'assigned', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    // Shared admin user model (registered as 'admin-user' by @travel-suite/auth).
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'admin-user' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

BookingSchema.virtual('customerName').get(function () {
  return `${this.bookingDetails.firstName} ${this.bookingDetails.lastName}`;
});

BookingSchema.pre(/^find/, function () {
  this.populate('vehicle', 'brand model class type featuredImage')
    .populate('pickup.zone', 'name')
    .populate('dropoff.zone', 'name')
    .populate('handledBy', 'name email');
});

BookingSchema.index({ bookingRef: 1 }, { unique: true });
BookingSchema.index({ pickupDate: 1 });
BookingSchema.index({ pickupTime: 1 });
BookingSchema.index({ status: 1 });
BookingSchema.index({ 'payment.status': 1 });
BookingSchema.index({ createdAt: -1 });
BookingSchema.index({ handledBy: 1 });

export default BookingSchema;

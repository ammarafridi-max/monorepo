import mongoose from 'mongoose';

const locationType = {
  type: String,
  enum: ['airport', 'location', 'hotel', 'residence', 'custom'],
  default: 'location',
};

// Delivery record for one transactional email. Kept per-recipient because the
// customer send and the operator send fail independently: when the mail
// provider is half-broken (or the customer address bounces) the operator still
// needs to know exactly which of the two to re-send. `attempts` + `lastError`
// exist so a re-send run is auditable rather than fire-and-forget, and so the
// reason a paid booking went unannounced survives past the log retention.
const emailDelivery = () => ({
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  lastAttemptAt: { type: Date },
  sentAt: { type: Date },
  lastError: { type: String },
});

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
    // Did anyone actually get told about this booking? A paid booking whose
    // confirmation never left the building is invisible otherwise: the payment
    // succeeds, the webhook returns 200, and only the logs (briefly) know.
    notifications: {
      paymentConfirmation: {
        customer: emailDelivery(),
        admin: emailDelivery(),
      },
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
// Answers "which paid bookings never got a confirmation?" — the recovery query
// used by scripts/resend-booking-confirmations.js in the brand app.
BookingSchema.index({ 'payment.status': 1, 'notifications.paymentConfirmation.customer.status': 1 });
BookingSchema.index({ handledBy: 1 });

export default BookingSchema;

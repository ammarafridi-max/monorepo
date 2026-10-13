import mongoose from 'mongoose';
import { attributionSchemaField } from '@travel-suite/utils';
import { v4 as uuidv4 } from 'uuid';

const GuestSchema = new mongoose.Schema({
  title: String,
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
  isLead: { type: Boolean, default: false },
}, { _id: false });

const HotelSnapshotSchema = new mongoose.Schema({
  name: String,
  address: String,
  city: String,
  country: String,
  stars: Number,
  phone: String,
}, { _id: false });

const SupplierSchema = new mongoose.Schema({
  name: { type: String, default: 'liteapi' },
  hotelId: String,
  offerId: String,
  prebookId: String,
  bookingId: String,
  supplierBookingId: String,
  hotelConfirmationCode: String,
  price: { amount: Number, currency: String },
  quotedPrice: { amount: Number, currency: String },
  // True when the offer the customer picked had expired and an equivalent room was booked instead.
  offerReplaced: { type: Boolean, default: false },
  // Claimed atomically before the supplier is called, so a resent webhook can never book twice.
  bookClaimedAt: { type: Date, default: null },
  bookedAt: { type: Date, default: null },
  lastError: { type: String, default: null },
}, { _id: false });

const HotelBookingSchema = new mongoose.Schema(
  {
    sessionId: { type: String, default: uuidv4, unique: true },
    email: { type: String, required: true, match: /^\S+@\S+\.\S+$/ },
    phoneNumber: { code: { type: String }, digits: { type: String } },
    guests: [GuestSchema],
    occupancy: {
      rooms: { type: Number, default: 1, min: 1 },
      adults: { type: Number, default: 1, min: 1 },
      children: { type: [Number], default: [] },
    },
    guestNationality: { type: String, uppercase: true, trim: true },
    destination: {
      cityName: { type: String, trim: true },
      countryCode: { type: String, uppercase: true, trim: true },
    },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    nights: { type: Number, min: 1 },
    hotel: HotelSnapshotSchema,
    supplier: { type: SupplierSchema, default: () => ({}) },

    freeCancellationUntil: { type: Date, default: null },
    cancellationStatus: {
      type: String,
      enum: ['NOT_BOOKED', 'SCHEDULED', 'CANCELLED', 'FAILED'],
      default: 'NOT_BOOKED',
    },
    cancelledAt: { type: Date, default: null },
    cancellationFee: { amount: { type: Number }, currency: { type: String } },
    cancellationAttempts: { type: Number, default: 0 },

    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },
    // Claimed once at the payment transition, never rewritten: a resent webhook must not move a reservation up the admin list.
    paidAt: { type: Date, default: null },
    totalAmount: { type: Number },
    currency: { type: String, default: 'AED', uppercase: true, trim: true },
    amountPaid: { currency: { type: String }, amount: { type: Number } },
    transactionId: { type: String },
    paymentMethod: { type: String, enum: ['stripe', 'paypal'], default: 'stripe' },

    orderStatus: {
      type: String,
      enum: ['PENDING', 'BOOKED', 'DELIVERED', 'BOOKING_FAILED', 'REFUNDED'],
      default: 'PENDING',
    },
    // Claimed before the send so a retry of the booking cannot email the customer twice.
    confirmationEmailSentAt: { type: Date, default: null },
    documentUrl: { type: String, default: null },
    documentSentAt: { type: Date, default: null },
    adminDeliveryEmailSent: { type: Boolean, default: false },
    handledBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },

    affiliateId: { type: String, trim: true, default: null, match: [/^\d{9}$/, 'Affiliate ID must be exactly 9 digits'] },
    affiliateCapturedAt: { type: Date, default: null },
    affiliate: { type: mongoose.Schema.ObjectId, ref: 'Affiliate', default: null },
    attribution: attributionSchemaField(),
    metaAttribution: {
      fbp: { type: String },
      fbc: { type: String },
      clientIp: { type: String },
      userAgent: { type: String },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

HotelBookingSchema.virtual('leadGuest').get(function () {
  const lead = this.guests?.find((g) => g.isLead) ?? this.guests?.[0];
  if (!lead) return null;
  return `${lead.title || ''} ${lead.firstName || ''} ${lead.lastName || ''}`.trim();
});

HotelBookingSchema.index({ createdAt: -1 });
HotelBookingSchema.index({ email: 1 });
HotelBookingSchema.index({ orderStatus: 1 });
HotelBookingSchema.index({ paymentStatus: 1 });
HotelBookingSchema.index({ paymentStatus: 1, paidAt: -1 });
HotelBookingSchema.index({ cancellationStatus: 1, freeCancellationUntil: 1 });
HotelBookingSchema.index({ affiliateId: 1 });
HotelBookingSchema.index({ affiliate: 1 });

export default HotelBookingSchema;

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
    destination: {
      cityName: { type: String, trim: true },
      countryCode: { type: String, uppercase: true, trim: true },
    },
    checkIn: { type: String, required: true },
    checkOut: { type: String, required: true },
    nights: { type: Number, min: 1 },
    hotel: HotelSnapshotSchema,
    message: { type: String, trim: true, maxlength: 2000 },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },
    paidAt: { type: Date, default: null },
    totalAmount: { type: Number },
    currency: { type: String, default: 'AED', uppercase: true, trim: true },
    amountPaid: { currency: { type: String }, amount: { type: Number } },
    transactionId: { type: String },
    paymentMethod: { type: String, enum: ['stripe', 'paypal'], default: 'stripe' },

    orderStatus: {
      type: String,
      enum: ['PENDING', 'PROGRESS', 'DELIVERED', 'REFUNDED'],
      default: 'PENDING',
    },
    documentUrl: { type: String, default: null },
    reservationFile: {
      publicId: { type: String, default: null },
      format: { type: String, default: null },
      resourceType: { type: String, default: null },
    },
    documentSentAt: { type: Date, default: null },
    adminDeliveryEmailSent: { type: Boolean, default: false },
    handledBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },

    affiliateId: { type: String, trim: true, default: null, match: [/^\d{9}$/, 'Affiliate ID must be exactly 9 digits'] },
    affiliateCapturedAt: { type: Date, default: null },
    affiliate: { type: mongoose.Schema.ObjectId, ref: 'affiliate', default: null },
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
HotelBookingSchema.index({ affiliateId: 1 });
HotelBookingSchema.index({ affiliate: 1 });

export default HotelBookingSchema;

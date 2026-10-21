import mongoose from 'mongoose';
import { attributionSchemaField } from '@travel-suite/utils';
import { v4 as uuidv4 } from 'uuid';
import { TICKET_VALIDITIES, SHORTEST_VALIDITY } from '../validity.js';

const PassengerSchema = new mongoose.Schema({
  type: String,
  title: String,
  firstName: { type: String, trim: true },
  lastName: { type: String, trim: true },
});

const SegmentSchema = new mongoose.Schema({
  departure: { iataCode: String, date: String, time: String },
  arrival: { iataCode: String, date: String, time: String },
  duration: String,
  carrierCode: String,
  flightNumber: String,
  aircraftCode: String,
  airline: { name: String, logo: String },
});

const FlightSchema = new mongoose.Schema({ duration: String, segments: [SegmentSchema] });

const TicketSchema = new mongoose.Schema(
  {
    sessionId: { type: String, default: uuidv4, unique: true },
    type: { type: String, enum: ['One Way', 'Return'], default: 'One Way' },
    passengers: [PassengerSchema],
    email: { type: String, required: true, match: /^\S+@\S+\.\S+$/ },
    phoneNumber: { code: { type: String }, digits: { type: String } },
    pnr: { type: String },
    from: { type: String, required: true },
    to: { type: String, required: true },
    departureDate: { type: String, required: true },
    returnDate: { type: String },
    quantity: {
      adults: { type: Number },
      children: { type: Number },
      infants: { type: Number },
    },
    message: { type: String },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },
    paidAt: { type: Date, default: null },
    ticketValidity: { type: String, enum: TICKET_VALIDITIES, default: SHORTEST_VALIDITY },
    ticketDelivery: { immediate: { type: Boolean }, deliveryDate: { type: String } },
    adminDeliveryEmailSent: { type: Boolean, default: false },
    flightDetails: {
      departureFlight: FlightSchema,
      returnFlight: { type: FlightSchema, default: null },
    },
    totalAmount: { type: Number },
    currency: { type: String, default: 'AED', uppercase: true, trim: true },
    amountPaid: { currency: { type: String }, amount: { type: Number } },
    orderStatus: { type: String, enum: ['PENDING', 'DELIVERED', 'PROGRESS', 'REFUNDED'] },
    transactionId: { type: String },
    paymentMethod: { type: String, enum: ['stripe', 'paypal'], default: 'stripe' },
    handledBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
    reservationUrl: { type: String, default: null },
    reservationFile: {
      publicId: { type: String, default: null },
      format: { type: String, default: null },
      resourceType: { type: String, default: null },
    },
    reservationSentAt: { type: Date, default: null },
    affiliateId: { type: String, trim: true, default: null, match: [/^\d{9}$/, 'Affiliate ID must be exactly 9 digits'] },
    affiliateCapturedAt: { type: Date, default: null },
    affiliate: { type: mongoose.Schema.ObjectId, ref: 'Affiliate', default: null },
    affiliateCommissionPercent: { type: Number, default: null, min: 0, max: 100 },
    affiliateCommission: {
      currency: { type: String, default: null, uppercase: true, trim: true },
      amount: { type: Number, default: null },
    },
    amountPaidBase: {
      currency: { type: String, default: null, uppercase: true, trim: true },
      amount: { type: Number, default: null },
      rate: { type: Number, default: null },
    },
    affiliatePayout: { type: mongoose.Schema.ObjectId, ref: 'AffiliatePayout', default: null },
    refundedAt: { type: Date, default: null },
    attribution: attributionSchemaField(),
    openaiAttribution: {
      oppref: { type: String },
      obref: { type: String },
    },
    metaAttribution: {
      fbp: { type: String },
      fbc: { type: String },
      clientIp: { type: String },
      userAgent: { type: String },
    },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

TicketSchema.virtual('leadPassenger').get(function () {
  if (this.passengers?.length > 0) {
    const p = this.passengers[0];
    return `${p.title || ''} ${p.firstName || ''} ${p.lastName || ''}`.trim();
  }
  return null;
});

TicketSchema.index({ createdAt: -1 });
TicketSchema.index({ 'ticketDelivery.deliveryDate': 1, paymentStatus: 1 });
TicketSchema.index({ email: 1 });
TicketSchema.index({ orderStatus: 1 });
TicketSchema.index({ paymentStatus: 1 });
TicketSchema.index({ paymentStatus: 1, paidAt: -1 });
TicketSchema.index({ affiliateId: 1 });
TicketSchema.index({ affiliate: 1 });
TicketSchema.index({ affiliateCapturedAt: 1 });
TicketSchema.index({ affiliate: 1, paymentStatus: 1, paidAt: -1 });
TicketSchema.index({ affiliatePayout: 1 });

export default TicketSchema;

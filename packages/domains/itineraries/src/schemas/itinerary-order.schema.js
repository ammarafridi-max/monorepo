import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const PlaceSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const SegmentSchema = new mongoose.Schema(
  {
    from: { type: PlaceSchema, required: true },
    to: { type: PlaceSchema, required: true },
    date: { type: String, required: true },
  },
  { _id: false },
);

const ReservationsSchema = new mongoose.Schema(
  {
    flight: { type: String, enum: ['none', 'unconfirmed', 'confirmed'], default: 'none' },
    hotel: { type: String, enum: ['none', 'unconfirmed', 'confirmed'], default: 'none' },
  },
  { _id: false },
);

const ItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String, required: true },
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    type: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },
    activities: { type: [String], default: [] }, // legacy; retained for older orders
    accommodationNote: { type: String, default: '' }, // legacy
  },
  { _id: false },
);

const ItineraryDataSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    days: { type: [ItineraryDaySchema], default: [] },
  },
  { _id: false },
);

const ChatMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    text: { type: String, required: true },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
);

const ItineraryOrderSchema = new mongoose.Schema(
  {
    sessionId: { type: String, default: uuidv4, unique: true, index: true },

    input: {
      visaCountry: { type: String, required: true, trim: true },
      fromCountry: { type: String, required: true, trim: true },
      purpose: { type: String, required: true, trim: true },
      travellers: { type: Number, default: 1, min: 1 },
      traveller: {
        firstName: { type: String, required: true, trim: true },
        fullName: { type: String, trim: true },
        email: { type: String, required: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
        phone: { code: { type: String }, digits: { type: String } },
      },

      segments: { type: [SegmentSchema], default: [] },
      reservations: { type: ReservationsSchema, default: () => ({}) },

      arrival: { type: PlaceSchema },
      departure: { type: PlaceSchema },
      otherCountries: { type: [String], default: [] },
      startDate: { type: String },
      endDate: { type: String },
    },

    itineraryData: { type: ItineraryDataSchema, default: null },

    previewUrl: { type: String, default: null },
    cleanPdfUrl: { type: String, default: null },
    supportingDocuments: {
      type: [{ name: String, url: String }],
      default: [],
    },

    status: {
      type: String,
      enum: ['DRAFT', 'GENERATING', 'GENERATED', 'FAILED'],
      default: 'DRAFT',
    },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },

    regenCount: { type: Number, default: 0 },
    editCount: { type: Number, default: 0 },
    chatCount: { type: Number, default: 0 },
    chatMessages: { type: [ChatMessageSchema], default: [] },
    previewVersion: { type: Number, default: 0 },

    price: { type: Number, default: 49 },
    currency: { type: String, default: 'AED', uppercase: true, trim: true },

    transactionId: { type: String, default: null },
    amountPaid: { currency: { type: String }, amount: { type: Number } },
    paidAt: { type: Date, default: null },

    ipAddress: { type: String, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

ItineraryOrderSchema.index({ createdAt: -1 });
ItineraryOrderSchema.index({ paymentStatus: 1 });
ItineraryOrderSchema.index({ 'input.traveller.email': 1 });

export default ItineraryOrderSchema;

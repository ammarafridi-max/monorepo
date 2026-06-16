import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// A single place visited on the trip (customer-supplied, never derived from a DB).
const PlaceSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
  },
  { _id: false },
);

// One flight/travel leg of the trip, e.g. Dubai -> Zurich on 2026-07-20.
const SegmentSchema = new mongoose.Schema(
  {
    from: { type: PlaceSchema, required: true },
    to: { type: PlaceSchema, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
  },
  { _id: false },
);

// What the traveller has already arranged (helps tailor the itinerary).
const ReservationsSchema = new mongoose.Schema(
  {
    flight: { type: String, enum: ['none', 'unconfirmed', 'confirmed'], default: 'none' },
    hotel: { type: String, enum: ['none', 'unconfirmed', 'confirmed'], default: 'none' },
  },
  { _id: false },
);

// One day of the AI-generated plan. This is CONTENT ONLY — code owns the
// template and validation; the model never invents flights, hotels, or prices.
const ItineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    city: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    // Short activity type for the schedule badge (Arrival, Tourism, Business, Departure, ...).
    type: { type: String, default: '' },
    title: { type: String, default: '' },
    description: { type: String, default: '' }, // 1-2 sentence summary shown next to the title
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

// One turn of the AI-edit conversation. Replies are short summaries — never the
// full itinerary text — so this is safe to expose pre-payment.
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

    // -- Customer input (entered manually; we never pull from any database) ----
    input: {
      visaCountry: { type: String, required: true, trim: true }, // embassy being applied to
      fromCountry: { type: String, required: true, trim: true }, // country applying from (home)
      purpose: { type: String, required: true, trim: true }, // tourism, business, family-visit...
      travellers: { type: Number, default: 1, min: 1 },
      traveller: {
        firstName: { type: String, required: true, trim: true },
        fullName: { type: String, trim: true }, // mirrors firstName (back-compat)
        email: { type: String, required: true, lowercase: true, trim: true, match: /^\S+@\S+\.\S+$/ },
        phone: { code: { type: String }, digits: { type: String } },
      },

      // The route as a list of flight/travel segments (>= 1).
      segments: { type: [SegmentSchema], default: [] },
      reservations: { type: ReservationsSchema, default: () => ({}) },

      // -- Derived from segments (drive generation, validation, and the template) --
      arrival: { type: PlaceSchema }, // first destination (day 1)
      departure: { type: PlaceSchema }, // last destination (last day)
      otherCountries: { type: [String], default: [] }, // intermediate countries, chronological
      startDate: { type: String }, // YYYY-MM-DD (first segment date)
      endDate: { type: String }, // YYYY-MM-DD (last segment date)
    },

    // -- AI output (server-only; never sent to the client before payment) ------
    itineraryData: { type: ItineraryDataSchema, default: null },

    // -- Generated artefacts ---------------------------------------------------
    // Watermarked preview is the only thing a pre-payment client can read.
    previewImage: { type: Buffer, default: null, select: false },
    // Clean, print-ready PDF is rendered/cached only after payment.
    cleanPdf: { type: Buffer, default: null, select: false },

    // -- Lifecycle -------------------------------------------------------------
    status: {
      type: String,
      enum: ['DRAFT', 'GENERATED', 'FAILED'],
      default: 'DRAFT',
    },
    paymentStatus: { type: String, enum: ['UNPAID', 'PAID', 'REFUNDED'], default: 'UNPAID' },

    // Pre-payment regeneration budget (max free regens enforced in the service).
    regenCount: { type: Number, default: 0 },
    // Post-payment edits within the free window.
    editCount: { type: Number, default: 0 },
    // Pre-payment conversational AI edits (bounded budget enforced in the service).
    chatCount: { type: Number, default: 0 },
    chatMessages: { type: [ChatMessageSchema], default: [] },
    // Bumps on every content change so the client can cache-bust the preview image.
    previewVersion: { type: Number, default: 0 },

    price: { type: Number, default: 49 },
    currency: { type: String, default: 'AED', uppercase: true, trim: true },

    transactionId: { type: String, default: null },
    amountPaid: { currency: { type: String }, amount: { type: Number } },
    paidAt: { type: Date, default: null },

    // Abuse tracking — rate-limit per session and IP.
    ipAddress: { type: String, default: null },
    lastError: { type: String, default: null },
  },
  { timestamps: true },
);

ItineraryOrderSchema.index({ createdAt: -1 });
ItineraryOrderSchema.index({ paymentStatus: 1 });
ItineraryOrderSchema.index({ 'input.traveller.email': 1 });

export default ItineraryOrderSchema;

import mongoose from 'mongoose';
import { TICKET_VALIDITIES } from '@travel-suite/utils/ticket-validity';

const LogoCandidateSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    source: { type: String, enum: ['wikimedia', 'wikimedia-search', 'airlabs'], required: true },
    sourceLabel: { type: String, default: null },
    sourcePage: { type: String, default: null },
    licence: { type: String, default: null },
    mime: { type: String, default: null },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    lowRes: { type: Boolean, default: false },
    score: { type: Number, default: 0 },
  },
  { _id: false },
);

const AirlineSchema = new mongoose.Schema({
  iataCode: { type: String, unique: true, sparse: true, index: true },
  icaoCode: { type: String },
  businessName: { type: String },
  commonName: { type: String },
  logo: { type: String },
  isVisible: { type: Boolean, default: true },
  ticketValidities: {
    type: [{ type: String, enum: TICKET_VALIDITIES }],
    default: () => [...TICKET_VALIDITIES],
  },
  logoCandidates: { type: [LogoCandidateSchema], default: [] },
  logoCandidatesAt: { type: Date, default: null },
});

export default AirlineSchema;

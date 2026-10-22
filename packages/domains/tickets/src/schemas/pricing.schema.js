import mongoose from 'mongoose';
import { TICKET_VALIDITIES } from '../validity.js';

const PricingOptionSchema = new mongoose.Schema(
  {
    validity: { type: String, required: true, trim: true, enum: TICKET_VALIDITIES },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false },
);

const TicketPricingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, default: 'dummy-ticket' },
    currency: { type: String, required: true, default: 'AED', uppercase: true, trim: true },
    options: { type: [PricingOptionSchema], default: [] },
    updatedBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
  },
  { collection: 'dummy-ticket-prices', timestamps: true },
);

TicketPricingSchema.index({ key: 1, currency: 1 }, { unique: true });

export default TicketPricingSchema;

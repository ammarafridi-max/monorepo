import mongoose from 'mongoose';

/**
 * One row per check somebody runs.
 *
 * This is the cheapest market research available: after a month it says exactly
 * which nationality-and-destination corridors real people ask about, which
 * tells you which destinations to add, which landing pages to write, and
 * whether a paid data provider is worth its fee.
 *
 * Deliberately not personal data — no name, no email, no IP. Just the shape of
 * the question and what was answered, so it needs no consent banner and cannot
 * leak anything about an individual.
 */
const VisaQuerySchema = new mongoose.Schema(
  {
    nationality: { type: String, required: true, uppercase: true, trim: true, index: true },
    residence: { type: String, uppercase: true, trim: true, default: null },
    destination: { type: String, required: true, uppercase: true, trim: true, index: true },

    outcome: { type: String, required: true },
    /** Which provider answered: our own rules, or a third party. */
    source: { type: String, default: 'curated' },
    /** True when the destination is one the brand actually sells. */
    isServiced: { type: Boolean, default: false, index: true },
    /** True when no rule existed and the default was used — a coverage gap. */
    wasFallback: { type: Boolean, default: false, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

VisaQuerySchema.index({ createdAt: -1 });
VisaQuerySchema.index({ destination: 1, nationality: 1 });

export default VisaQuerySchema;

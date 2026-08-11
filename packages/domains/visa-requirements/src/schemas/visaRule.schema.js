import mongoose from 'mongoose';

/**
 * Visa rules, stored one document per DESTINATION.
 *
 * The obvious model is a row per (nationality, destination) pair, which is
 * ~40,000 rows for full coverage and miserable to keep current. Published visa
 * data is organised by destination — "these nationalities enter visa-free" —
 * so the storage matches that shape. Around 200 documents instead, and changing
 * a country's policy is one edit.
 *
 * Residence is modelled as overrides rather than another axis. A UAE residence
 * permit changes the answer for a handful of passports per destination, not for
 * all of them, so listing the exceptions is far smaller than a full
 * nationality x residence x destination matrix — and residence is exactly what
 * generic providers get wrong for this audience.
 */

export const OUTCOMES = ['VISA_FREE', 'VISA_ON_ARRIVAL', 'EVISA', 'ETA', 'VISA_REQUIRED'];

/** A group of nationalities that share one outcome for this destination. */
const outcomeGroupSchema = new mongoose.Schema(
  {
    outcome: { type: String, enum: OUTCOMES, required: true },
    // ISO 3166-1 alpha-2, uppercased on save.
    nationalities: { type: [String], default: [] },
    maxStayDays: { type: Number, min: 0, default: null },
    note: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { _id: false },
);

/**
 * Residence-based exception. Takes precedence over the nationality groups.
 * `nationalities` empty means "any nationality holding this residence".
 */
const residenceOverrideSchema = new mongoose.Schema(
  {
    residence: { type: String, required: true, uppercase: true, trim: true },
    nationalities: { type: [String], default: [] },
    outcome: { type: String, enum: OUTCOMES, required: true },
    maxStayDays: { type: Number, min: 0, default: null },
    note: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { _id: false },
);

const VisaRuleSchema = new mongoose.Schema(
  {
    destination: {
      type: String,
      required: [true, 'Destination country code is required'],
      uppercase: true,
      trim: true,
      unique: true,
      index: true,
    },
    destinationName: { type: String, required: true, trim: true },

    /** Links the answer to a visa landing page when the brand sells this one. */
    visaSlug: { type: String, trim: true, default: null },

    /** Applied when nothing else matches. Visa-required is the safe default. */
    defaultOutcome: { type: String, enum: OUTCOMES, default: 'VISA_REQUIRED' },

    groups: { type: [outcomeGroupSchema], default: [] },
    residenceOverrides: { type: [residenceOverrideSchema], default: [] },

    /**
     * Provenance. Shown to the user, because a visa answer with no date and no
     * source is worth very little and carries real risk if it is stale.
     */
    officialSourceUrl: { type: String, trim: true, default: '' },
    officialSourceName: { type: String, trim: true, default: '' },
    lastVerifiedAt: { type: Date, default: null },

    generalNotes: { type: String, trim: true, maxlength: 2000, default: '' },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

// Codes are compared exactly, so normalise on the way in rather than trusting
// every caller and every admin edit to uppercase them.
VisaRuleSchema.pre('save', function normaliseCodes() {
  const up = (arr) => (arr || []).map((c) => String(c).toUpperCase().trim()).filter(Boolean);
  for (const g of this.groups || []) g.nationalities = up(g.nationalities);
  for (const r of this.residenceOverrides || []) r.nationalities = up(r.nationalities);
});

export default VisaRuleSchema;

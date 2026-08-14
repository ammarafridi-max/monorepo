import mongoose from 'mongoose';

export const OUTCOMES = ['VISA_FREE', 'VISA_ON_ARRIVAL', 'EVISA', 'ETA', 'VISA_REQUIRED'];

const outcomeGroupSchema = new mongoose.Schema(
  {
    outcome: { type: String, enum: OUTCOMES, required: true },
    nationalities: { type: [String], default: [] },
    maxStayDays: { type: Number, min: 0, default: null },
    note: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { _id: false },
);

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

    visaSlug: { type: String, trim: true, default: null },

    defaultOutcome: { type: String, enum: OUTCOMES, default: 'VISA_REQUIRED' },

    groups: { type: [outcomeGroupSchema], default: [] },
    residenceOverrides: { type: [residenceOverrideSchema], default: [] },

    officialSourceUrl: { type: String, trim: true, default: '' },
    officialSourceName: { type: String, trim: true, default: '' },
    lastVerifiedAt: { type: Date, default: null },

    generalNotes: { type: String, trim: true, maxlength: 2000, default: '' },
    isPublished: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

VisaRuleSchema.pre('save', function normaliseCodes() {
  const up = (arr) => (arr || []).map((c) => String(c).toUpperCase().trim()).filter(Boolean);
  for (const g of this.groups || []) g.nationalities = up(g.nationalities);
  for (const r of this.residenceOverrides || []) r.nationalities = up(r.nationalities);
});

export default VisaRuleSchema;

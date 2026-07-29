import mongoose from 'mongoose';

const { Schema } = mongoose;

// Enums the rule conditions draw from. Kept here so the schema validates rule
// values, but the MATCHER itself (matcher.js) is pure and enum-agnostic.
export const AGE_GROUPS = ['ADULT', 'MINOR'];
export const FINANCIAL_SUPPORT = ['SELF', 'SPONSORED'];
export const ACCOMMODATION_TYPES = ['HOTEL', 'HOST'];
export const MINOR_TRAVELLING_WITH = ['BOTH_PARENTS', 'ONE_PARENT', 'NEITHER'];

// A rule's `when` block. Every PRESENT condition must match for the rule to apply;
// an ABSENT condition matches anything. Array conditions are a list of accepted
// values (OR). `isPrimary` is a single boolean.
const ruleWhenSchema = new Schema(
  {
    ageGroup: { type: [String], enum: AGE_GROUPS, default: undefined },
    employmentStatus: { type: [String], default: undefined },
    financialSupport: { type: [String], enum: FINANCIAL_SUPPORT, default: undefined },
    accommodationType: { type: [String], enum: ACCOMMODATION_TYPES, default: undefined },
    minorTravellingWith: { type: [String], enum: MINOR_TRAVELLING_WITH, default: undefined },
    isPrimary: { type: Boolean, default: undefined },
  },
  { _id: false },
);

const ruleSchema = new Schema(
  {
    // Must resolve to a DocumentType.key. Not a hard ref so a template can be authored
    // before every type exists; the service validates resolution at seed time.
    documentTypeKey: { type: String, required: true, uppercase: true, trim: true },
    when: { type: ruleWhenSchema, default: () => ({}) },
    isOptional: { type: Boolean, default: false }, // staff can waive an optional row
  },
  { _id: true },
);

const checklistTemplateSchema = new Schema(
  {
    // e.g. SCHENGEN. Only Schengen is seeded now; UK/US are added later as data.
    visaTypeKey: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    isActive: { type: Boolean, default: true },
    rules: { type: [ruleSchema], default: [] },
  },
  { timestamps: true },
);

export default checklistTemplateSchema;

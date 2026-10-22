import mongoose from 'mongoose';

const { Schema } = mongoose;

export const AGE_GROUPS = ['ADULT', 'MINOR'];
export const FINANCIAL_SUPPORT = ['SELF', 'SPONSORED'];
export const ACCOMMODATION_TYPES = ['HOTEL', 'HOST'];
export const MINOR_TRAVELLING_WITH = ['BOTH_PARENTS', 'ONE_PARENT', 'NEITHER'];

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
    documentTypeKey: { type: String, required: true, uppercase: true, trim: true },
    when: { type: ruleWhenSchema, default: () => ({}) },
    isOptional: { type: Boolean, default: false },
  },
  { _id: true },
);

const checklistTemplateSchema = new Schema(
  {
    visaTypeKey: { type: String, required: true, uppercase: true, trim: true, index: true },
    name: { type: String, trim: true, maxlength: 120, default: '' },
    isActive: { type: Boolean, default: true },
    rules: { type: [ruleSchema], default: [] },
  },
  { timestamps: true },
);

export default checklistTemplateSchema;

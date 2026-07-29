import mongoose from 'mongoose';
import { FINANCIAL_SUPPORT, MINOR_TRAVELLING_WITH } from './checklistTemplate.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

// Employment is no longer a checklist driver by enum alone — the template rules
// reference these values. MINOR is NOT an employment status any more (age is derived
// from dateOfBirth); it is kept out of this list.
export const EMPLOYMENT_STATUSES = [
  'EMPLOYED',
  'SELF_EMPLOYED',
  'BUSINESS_OWNER',
  'STUDENT',
  'RETIRED',
  'UNEMPLOYED',
];

const applicantSchema = new Schema(
  {
    application: { type: ObjectId, ref: 'VisaApplication', required: true, index: true },
    isPrimary: { type: Boolean, default: false },

    firstName: { type: String, trim: true, maxlength: 80, default: '' },
    lastName: { type: String, trim: true, maxlength: 80, default: '' },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true, maxlength: 100, default: '' },
    passportNumber: { type: String, trim: true, maxlength: 40, default: '' },
    passportExpiry: { type: Date },

    relationshipToPrimary: { type: String, trim: true, maxlength: 60, default: '' },

    // ---- profile answers that drive the template rules ---------------------
    // ageGroup (ADULT/MINOR) is DERIVED from dateOfBirth, never stored.
    employmentStatus: { type: String, enum: [...EMPLOYMENT_STATUSES, null], default: null },
    financialSupport: { type: String, enum: [...FINANCIAL_SUPPORT, null], default: null },
    // Set when financialSupport is SPONSORED — points at the applicant who funds them.
    sponsorApplicant: { type: ObjectId, ref: 'Applicant', default: null },
    minorTravellingWith: { type: String, enum: [...MINOR_TRAVELLING_WITH, null], default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export default applicantSchema;

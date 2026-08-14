import mongoose from 'mongoose';
import { FINANCIAL_SUPPORT, MINOR_TRAVELLING_WITH } from './checklistTemplate.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

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
    application: { type: ObjectId, ref: 'visa-application', required: true, index: true },
    isPrimary: { type: Boolean, default: false },

    firstName: { type: String, trim: true, maxlength: 80, default: '' },
    lastName: { type: String, trim: true, maxlength: 80, default: '' },
    dateOfBirth: { type: Date },
    nationality: { type: String, trim: true, maxlength: 100, default: '' },
    passportNumber: { type: String, trim: true, maxlength: 40, default: '' },
    passportExpiry: { type: Date },

    relationshipToPrimary: { type: String, trim: true, maxlength: 60, default: '' },

    employmentStatus: { type: String, enum: [...EMPLOYMENT_STATUSES, null], default: null },
    financialSupport: { type: String, enum: [...FINANCIAL_SUPPORT, null], default: null },
    sponsorApplicant: { type: ObjectId, ref: 'applicant', default: null },
    minorTravellingWith: { type: String, enum: [...MINOR_TRAVELLING_WITH, null], default: null },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

export default applicantSchema;

import mongoose from 'mongoose';
import { DOCUMENT_SOURCES } from './documentType.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

export const DOC_STATUSES = ['REQUIRED', 'UPLOADED', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE'];

const documentHistorySchema = new Schema(
  {
    version: { type: Number },
    status: { type: String },
    rejectionReason: { type: String, default: '' },
    reviewedBy: { type: ObjectId, ref: 'admin-user' },
    cloudinaryPublicId: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    uploadedAt: { type: Date },
    reviewedAt: { type: Date },
  },
  { _id: false },
);

const applicationDocumentSchema = new Schema(
  {
    application: { type: ObjectId, ref: 'visa-application', required: true, index: true },
    applicant: { type: ObjectId, ref: 'applicant', required: true, index: true },

    documentType: { type: ObjectId, ref: 'document-type', required: true },
    docTypeKey: { type: String, uppercase: true, trim: true, required: true, index: true },
    source: { type: String, enum: DOCUMENT_SOURCES, required: true, index: true },

    status: { type: String, enum: DOC_STATUSES, default: 'REQUIRED', required: true, index: true },
    rejectionReason: { type: String, trim: true, maxlength: 1000, default: '' },

    satisfiedBy: { type: ObjectId, ref: 'application-document', default: null },

    addedManually: { type: Boolean, default: false },
    isOptional: { type: Boolean, default: false },
    note: { type: String, trim: true, maxlength: 1000, default: '' },

    // Store the public_id, never a raw secure_url — reads go through a signed short-lived URL.
    cloudinaryPublicId: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    version: { type: Number, default: 0 },

    uploadedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: ObjectId, ref: 'admin-user' },

    history: { type: [documentHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

applicationDocumentSchema.index({ applicant: 1, docTypeKey: 1 }, { unique: true });

export default applicationDocumentSchema;

import mongoose from 'mongoose';
import { DOCUMENT_SOURCES } from './documentType.schema.js';

const { Schema, Types: { ObjectId } } = mongoose;

// NOT_APPLICABLE = a row that was required under a previous profile answer but no
// longer applies. Kept (not deleted) for audit and ignored by both completeness
// denominators.
export const DOC_STATUSES = ['REQUIRED', 'UPLOADED', 'APPROVED', 'REJECTED', 'NOT_APPLICABLE'];

// One entry per superseded version of a document. When a rejected (or otherwise
// replaced) file is re-uploaded, the outgoing state is pushed here so old versions
// stay retrievable by admins. The old Cloudinary asset is never deleted.
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
    application: { type: ObjectId, ref: 'VisaApplication', required: true, index: true },
    applicant: { type: ObjectId, ref: 'Applicant', required: true, index: true },

    // Data-driven type: a ref plus a denormalised key copy for readability/queries.
    documentType: { type: ObjectId, ref: 'DocumentType', required: true },
    docTypeKey: { type: String, uppercase: true, trim: true, required: true, index: true },
    // Copied from the DocumentType at seed time (who is responsible for this row).
    source: { type: String, enum: DOCUMENT_SOURCES, required: true, index: true },

    status: { type: String, enum: DOC_STATUSES, default: 'REQUIRED', required: true, index: true },
    rejectionReason: { type: String, trim: true, maxlength: 1000, default: '' },

    // When set, this row is fulfilled by ANOTHER applicant's uploaded document in the
    // SAME application (e.g. a child's PARENT_PASSPORT → the father's PASSPORT row, or
    // a sponsored spouse's SPONSOR_BANK_STATEMENT → her husband's BANK_STATEMENT).
    // A satisfied row stores no file of its own; it reads its status from the source
    // row and counts complete once that source row is APPROVED.
    satisfiedBy: { type: ObjectId, ref: 'ApplicationDocument', default: null },

    // Rows staff add outside the active template are never auto-removed by reconcile.
    addedManually: { type: Boolean, default: false },
    // Copied from the matching rule; staff can waive an optional row.
    isOptional: { type: Boolean, default: false },
    // Optional staff note (e.g. for an IN_PERSON row marked complete without a file).
    note: { type: String, trim: true, maxlength: 1000, default: '' },

    // Cloudinary authenticated asset. We store the public_id (which embeds the
    // version) — NEVER a raw secure_url. Reads go through a signed short-lived URL.
    cloudinaryPublicId: { type: String, default: '' },
    originalFilename: { type: String, default: '' },
    mimeType: { type: String, default: '' },
    sizeBytes: { type: Number, default: 0 },
    version: { type: Number, default: 0 },

    uploadedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: ObjectId, ref: 'admin-user' },

    // Superseded versions, oldest first. Empty until the first re-upload.
    history: { type: [documentHistorySchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// One live checklist row per (applicant, docTypeKey).
applicationDocumentSchema.index({ applicant: 1, docTypeKey: 1 }, { unique: true });

export default applicationDocumentSchema;

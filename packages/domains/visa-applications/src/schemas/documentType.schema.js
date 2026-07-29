import mongoose from 'mongoose';

const { Schema } = mongoose;

// Who is responsible for a document:
//  CUSTOMER  — the applicant uploads it (passport, bank statement, ...)
//  AGENT     — staff produce and upload it (flight reservation, insurance, ...)
//  IN_PERSON — happens offline; staff just mark it done (the studio photo)
export const DOCUMENT_SOURCES = ['CUSTOMER', 'AGENT', 'IN_PERSON'];

export const DEFAULT_ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

// A data-driven registry entry. Replaces the old hardcoded docType enum, so adding
// UK/US document types (or renaming a label) is a data change, not a code change.
const documentTypeSchema = new Schema(
  {
    // Stable machine key referenced by ChecklistTemplate rules and ApplicationDocument.
    key: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    customerHelpText: { type: String, trim: true, maxlength: 400, default: '' },
    source: { type: String, enum: DOCUMENT_SOURCES, required: true },
    acceptedMimeTypes: { type: [String], default: () => [...DEFAULT_ACCEPTED_MIME] },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export default documentTypeSchema;

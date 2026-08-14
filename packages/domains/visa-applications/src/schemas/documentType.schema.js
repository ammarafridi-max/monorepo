import mongoose from 'mongoose';

const { Schema } = mongoose;

export const DOCUMENT_SOURCES = ['CUSTOMER', 'AGENT', 'IN_PERSON'];

export const DEFAULT_ACCEPTED_MIME = ['application/pdf', 'image/jpeg', 'image/png'];

const documentTypeSchema = new Schema(
  {
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

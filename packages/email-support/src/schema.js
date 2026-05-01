import mongoose from 'mongoose';

const SupportEmailSchema = new mongoose.Schema(
  {
    gmailMessageId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    gmailThreadId: {
      type: String,
      required: true,
    },
    from: { type: String },
    fromEmail: { type: String },
    fromName: { type: String },
    subject: { type: String },
    bodyText: { type: String },
    receivedAt: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'sent', 'skipped'],
      default: 'pending',
      index: true,
    },
    skippedReason: { type: String },
    draft: { type: String },
    sentAt: { type: Date },
    skippedAt: { type: Date },
  },
  { timestamps: true },
);

export default SupportEmailSchema;

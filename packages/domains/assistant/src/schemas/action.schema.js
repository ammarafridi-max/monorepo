import mongoose from 'mongoose';

export const ACTION_STATUSES = ['pending', 'executed', 'failed', 'cancelled'];

const AssistantActionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'admin-user', required: true },
    userName: { type: String, trim: true },
    conversation: { type: mongoose.Schema.ObjectId, ref: 'assistant-conversation', default: null },
    kind: { type: String, required: true, trim: true },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    details: { type: [String], default: [] },
    params: { type: mongoose.Schema.Types.Mixed, required: true },
    status: { type: String, enum: ACTION_STATUSES, default: 'pending', index: true },
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, trim: true, default: null },
    decidedBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
    decidedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

AssistantActionSchema.index({ user: 1, createdAt: -1 });

export default AssistantActionSchema;

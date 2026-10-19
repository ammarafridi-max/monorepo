import mongoose from 'mongoose';

const AssistantToolCallSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'admin-user', required: true },
    userName: { type: String, trim: true },
    role: { type: String, trim: true },
    conversation: { type: mongoose.Schema.ObjectId, ref: 'assistant-conversation', default: null },
    tool: { type: String, required: true, trim: true },
    dataset: { type: String, trim: true, default: null },
    input: { type: mongoose.Schema.Types.Mixed, default: null },
    rowCount: { type: Number, default: 0 },
    unmasked: { type: Boolean, default: false },
    durationMs: { type: Number, default: 0 },
    error: { type: String, trim: true, default: null },
  },
  { timestamps: true },
);

AssistantToolCallSchema.index({ createdAt: -1 });
AssistantToolCallSchema.index({ user: 1, createdAt: -1 });
AssistantToolCallSchema.index({ dataset: 1, createdAt: -1 });

export default AssistantToolCallSchema;

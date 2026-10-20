import mongoose from 'mongoose';

const AssistantTurnSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: mongoose.Schema.Types.Mixed, required: true },
    at: { type: Date, default: Date.now },
  },
  // minimize must stay off: Mongoose drops an empty object, and a tool called with
  // no arguments stores input: {}, which the Messages API then rejects on replay.
  { _id: false, minimize: false },
);

const AssistantConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'admin-user', required: true },
    title: { type: String, trim: true, maxlength: 120, default: 'New conversation' },
    turns: { type: [AssistantTurnSchema], default: [] },
    usage: {
      requests: { type: Number, default: 0 },
      inputTokens: { type: Number, default: 0 },
      outputTokens: { type: Number, default: 0 },
      cacheReadTokens: { type: Number, default: 0 },
    },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

AssistantConversationSchema.index({ user: 1, lastMessageAt: -1 });

export default AssistantConversationSchema;

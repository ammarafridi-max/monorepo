import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.ObjectId, ref: 'conversation', required: true },
    waId: { type: String, required: true, trim: true },
    // Meta's message id. Unique because webhooks are retried and events are resent.
    wamid: { type: String, required: true, unique: true, trim: true },
    direction: { type: String, enum: ['INBOUND', 'OUTBOUND'], required: true },
    type: { type: String, default: 'text' },
    text: { type: String, default: null },
    media: {
      id: { type: String, default: null },
      mimeType: { type: String, default: null },
      url: { type: String, default: null },
      filename: { type: String, default: null },
      caption: { type: String, default: null },
    },
    replyToWamid: { type: String, default: null },
    status: { type: String, enum: ['RECEIVED', 'SENT', 'DELIVERED', 'READ', 'FAILED'], default: 'RECEIVED' },
    error: { type: String, default: null },
    sentBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
    sentAt: { type: Date, required: true },
  },
  { timestamps: true },
);

MessageSchema.index({ conversation: 1, sentAt: -1 });

export default MessageSchema;

import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema(
  {
    waId: { type: String, required: true, unique: true, trim: true },
    profileName: { type: String, trim: true, default: null },
    lastMessageAt: { type: Date, default: null },
    lastMessagePreview: { type: String, default: null },
    // Replies are only allowed for 24h after the customer's last inbound message.
    lastInboundAt: { type: Date, default: null },
    unreadCount: { type: Number, default: 0 },
    status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' },
    assignedTo: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

ConversationSchema.virtual('windowExpiresAt').get(function () {
  if (!this.lastInboundAt) return null;
  return new Date(this.lastInboundAt.getTime() + 24 * 60 * 60 * 1000);
});

ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ status: 1, lastMessageAt: -1 });

export default ConversationSchema;

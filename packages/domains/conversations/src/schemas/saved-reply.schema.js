import mongoose from 'mongoose';

const SavedReplySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true, trim: true },
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'admin-user', default: null },
  },
  { timestamps: true },
);

SavedReplySchema.index({ title: 1 });

export default SavedReplySchema;

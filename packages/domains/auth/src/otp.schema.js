import mongoose from 'mongoose';

const AdminOtpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'admin-user', required: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    purpose: { type: String, required: true, enum: ['login', 'reset'], default: 'login' },
    usableUntil: { type: Date, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    supersededAt: { type: Date, default: null },
    requestIp: { type: String, default: null },
  },
  { collection: 'admin-otps', timestamps: true },
);

// expiresAt is the TTL retention deadline that must outlast the hourly request window; usableUntil is the code's validity.
AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

AdminOtpSchema.index({ user: 1, createdAt: -1 });

AdminOtpSchema.index({
  user: 1,
  purpose: 1,
  consumedAt: 1,
  supersededAt: 1,
  createdAt: -1,
  usableUntil: 1,
});

export default AdminOtpSchema;

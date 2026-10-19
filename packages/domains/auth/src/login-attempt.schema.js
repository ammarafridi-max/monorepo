import mongoose from 'mongoose';

const AdminLoginAttemptSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    failures: { type: Number, default: 0 },
    windowStartedAt: { type: Date, required: true },
    lastFailureAt: { type: Date, required: true },
    lockedUntil: { type: Date, default: null },
    lockCount: { type: Number, default: 0 },
    expiresAt: { type: Date, required: true },
  },
  { collection: 'admin-login-attempts', timestamps: true },
);

AdminLoginAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default AdminLoginAttemptSchema;

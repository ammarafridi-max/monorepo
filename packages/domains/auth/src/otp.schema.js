import mongoose from 'mongoose';

const AdminOtpSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.ObjectId, ref: 'admin-user', required: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    // A login code must never work as a reset code: whoever glimpses one could
    // otherwise take the account over permanently.
    purpose: { type: String, required: true, enum: ['login', 'reset'], default: 'login', index: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
    supersededAt: { type: Date, default: null },
    requestIp: { type: String, default: null },
  },
  { collection: 'admin-otps', timestamps: true },
);

// Mongo deletes expired codes on its own, so nothing has to sweep them and a
// stale code can never outlive its window because a cleanup job failed.
AdminOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default AdminOtpSchema;

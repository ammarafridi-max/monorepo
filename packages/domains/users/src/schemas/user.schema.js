import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, trim: true, default: '' },
    lastName: { type: String, trim: true, default: '' },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, minlength: 8, select: false },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    magicLinkToken: { type: String, select: false },
    magicLinkExpires: { type: Date, select: false },
  },
  { timestamps: true },
);

UserSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.correctPassword = async function (candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

UserSchema.methods.createPasswordResetToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(token).digest('hex');
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
  return token;
};

UserSchema.methods.createEmailVerifyToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerifyToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return token;
};

UserSchema.methods.createMagicLinkToken = function () {
  const token = crypto.randomBytes(32).toString('hex');
  this.magicLinkToken = crypto.createHash('sha256').update(token).digest('hex');
  this.magicLinkExpires = new Date(Date.now() + 20 * 60 * 1000);
  return token;
};

export default UserSchema;

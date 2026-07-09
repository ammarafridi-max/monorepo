import mongoose from 'mongoose';

/**
 * Mongoose schema + model for a User (collection "users").
 *
 * The OPTIONAL account layer. Buying stays anonymous (email field only, exactly
 * as before); a User only exists for returning customers who sign up to see their
 * past orders. Mirrors orderModel.js: schema only, no business logic, HMR-safe
 * model registration.
 */

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    // Lowercased + unique: the identity anchor, and the key anonymous orders are
    // back-linked by (an order carries the same customerEmail).
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },

    // Credentials auth: a bcrypt hash, never the plaintext password.
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

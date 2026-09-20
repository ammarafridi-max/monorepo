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

    // Credentials auth: a bcrypt hash, never the plaintext password. Optional
    // because social-login accounts (Google/Facebook/LinkedIn) have no password;
    // those users authenticate through the provider. A password account has it set.
    passwordHash: { type: String, default: null },

    // Which social providers have been linked to this account, if any. Purely
    // informational; the email above is still the single identity anchor.
    providers: { type: [String], default: [] },

    // What the funnel asks about the person, saved so the next set is prefilled
    // and editable from the account page. Catalog ids from catalog.js.
    profile: {
      gender: { type: String, default: '' },
      ageRange: { type: String, default: '' },
      race: { type: String, default: '' },
      facialHair: { type: String, default: '' },
      build: { type: String, default: '' },
      height: { type: String, default: '' },
    },

    // Email verification, required before a password account can enter a funnel.
    // OAuth accounts are verified by the provider and get the timestamp at creation.
    emailVerifiedAt: { type: Date, default: null },
    verificationCodeHash: { type: String, default: null },
    verificationExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.models.User || mongoose.model('User', userSchema);

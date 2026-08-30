import mongoose from 'mongoose';

/**
 * Mongoose schema + model for an AdminUser (collection "adminusers").
 *
 * The STAFF identity layer, kept entirely separate from the customer `User`
 * model: an admin is never a customer and vice versa. Mirrors the reference
 * travel-suite admin-user, adapted to Picturesk's convention that shared models
 * are schema-only (no business logic): the password is stored as a bcrypt
 * `passwordHash` set by the api's auth service (apps/api/admin), exactly like the
 * customer `User.passwordHash`. There is NO hashing hook and NO instance method
 * here on purpose. `passwordChangedAt` lets the auth middleware invalidate tokens
 * issued before a password change.
 *
 * Auth flow lives in apps/api/admin: login (email + password) issues a JWT in an
 * httpOnly cookie carrying { id, role, type: 'admin' }; `protect` reloads this
 * doc and `restrictTo(...roles)` guards by `role`.
 */

const { Schema } = mongoose;

// lowercase letters/numbers to start, then letters/numbers/dot/underscore/hyphen.
// 8-50 chars total. Matches the reference so usernames are portable.
const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{7,49}$/;

const adminUserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },

    // The login-adjacent handle admins are addressed by in the (future) admin-user
    // CRUD screen. Unique + indexed. Email is still the login identity anchor.
    username: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
      trim: true,
      minlength: 8,
      maxlength: 50,
      match: USERNAME_REGEX,
      index: true,
    },

    // The login identity anchor. Lowercased + unique + indexed.
    email: { type: String, required: true, lowercase: true, unique: true, trim: true, index: true },

    // bcrypt hash (cost 12), never the plaintext. Set by the api auth service, the
    // same way the customer User.passwordHash is. select:false so it is never
    // returned by a plain find(); the service does .select('+passwordHash') to read it.
    passwordHash: { type: String, required: true, select: false },

    // Access level. 'admin' is full access; 'support' is read-only (dashboards,
    // orders, customers). Extend the enum to add more roles; restrictTo() guards on it.
    role: { type: String, lowercase: true, enum: ['admin', 'support'], default: 'support', required: true },

    // An INACTIVE admin cannot log in and any existing session is rejected by the
    // auth middleware. Soft-disable instead of deleting.
    status: { type: String, uppercase: true, enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', index: true },

    // Stamped by the auth service on any password change. The middleware rejects a
    // token whose `iat` predates this, logging out other devices. select:false.
    passwordChangedAt: { type: Date, select: false },
  },
  { timestamps: true }
);

export const AdminUser = mongoose.models.AdminUser || mongoose.model('AdminUser', adminUserSchema);

import { AppError } from './errors.js';
import { hashPassword } from './authService.js';

/**
 * Admin-user MANAGEMENT (admin-only CRUD over other staff accounts). Ported from
 * the travel-suite admin-users service, adapted to Picturesk: roles are
 * admin|support, and passwords are stored as bcrypt `passwordHash` set here (the
 * schema is hook-free), not via a model pre-save hook.
 *
 * Two invariants protect against lockout + foot-guns:
 *  - ensureLastActiveAdminRemains: never demote/deactivate/delete the last ACTIVE admin.
 *  - self-protection: you cannot deactivate yourself, drop your own admin role, or
 *    delete yourself. (The ADMIN_TOKEN break-glass path has no _id, so it is exempt
 *    from self-checks but still bound by the last-active-admin invariant.)
 *
 * Own-profile + own-password changes live in the /auth router (/auth/me,
 * /auth/update-password), so they are intentionally absent here.
 */

const ROLES = ['admin', 'support'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function createAdminUsersService({ AdminUser }) {
  async function ensureEmailIsUnique(email, excludeId = null) {
    if (!email) return;
    const existing = await AdminUser.findOne({
      email,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (existing) throw new AppError('Email is already in use by another admin user.', 400);
  }

  async function ensureUsernameIsUnique(username, excludeId = null) {
    if (!username) return;
    const existing = await AdminUser.findOne({
      username,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    }).lean();
    if (existing) throw new AppError('Username is already in use by another admin user.', 400);
  }

  async function ensureLastActiveAdminRemains({ userIdToChange, nextRole, nextStatus }) {
    const current = await AdminUser.findById(userIdToChange).lean();
    if (!current) return;

    const isCurrentlyActiveAdmin = current.role === 'admin' && current.status === 'ACTIVE';
    const staysActiveAdmin = nextRole === 'admin' && nextStatus === 'ACTIVE';
    if (!isCurrentlyActiveAdmin || staysActiveAdmin) return;

    const otherActiveAdmins = await AdminUser.countDocuments({
      _id: { $ne: userIdToChange },
      role: 'admin',
      status: 'ACTIVE',
    });
    if (otherActiveAdmins === 0) {
      throw new AppError('At least one active admin must remain in the system.', 400);
    }
  }

  const list = async (query = {}) => {
    const filter = {};
    if (query.role && ROLES.includes(query.role)) filter.role = query.role;
    if (query.status && STATUSES.includes(query.status)) filter.status = query.status;

    const search = String(query.search || query.q || '').trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }];
    }
    return AdminUser.find(filter).sort({ createdAt: -1 });
  };

  const getByUsername = async (username) => {
    if (!username) throw new AppError("Please provide an admin user's username", 400);
    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) throw new AppError('Admin user not found.', 404);
    return user;
  };

  const create = async (payload) => {
    await ensureUsernameIsUnique(payload.username);
    await ensureEmailIsUnique(payload.email);

    const { password, ...rest } = payload;
    return AdminUser.create({ ...rest, passwordHash: await hashPassword(password) });
  };

  const update = async (username, payload, currentUser) => {
    if (payload.password || payload.passwordHash) {
      throw new AppError('Use the reset-password action to change a password.', 400);
    }
    const existing = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!existing) throw new AppError('Admin user not found.', 404);

    const nextRole = payload.role ?? existing.role;
    const nextStatus = payload.status ?? existing.status;

    if (currentUser && String(existing._id) === String(currentUser._id)) {
      if (nextStatus === 'INACTIVE') throw new AppError('You cannot deactivate your own account.', 400);
      if (nextRole !== 'admin') throw new AppError('You cannot remove your own admin role.', 400);
    }

    await ensureEmailIsUnique(payload.email, existing._id);
    await ensureLastActiveAdminRemains({ userIdToChange: existing._id, nextRole, nextStatus });

    return AdminUser.findOneAndUpdate({ username: existing.username }, payload, {
      runValidators: true,
      new: true,
    });
  };

  const remove = async (username, currentUser) => {
    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) throw new AppError('Admin user not found.', 404);

    if (currentUser && String(user._id) === String(currentUser._id)) {
      throw new AppError('You cannot delete your own account.', 400);
    }
    await ensureLastActiveAdminRemains({
      userIdToChange: user._id,
      nextRole: 'support',
      nextStatus: 'INACTIVE',
    });

    await AdminUser.findOneAndDelete({ username: user.username });
    return user;
  };

  const setPassword = async (username, { password }, currentUser) => {
    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) throw new AppError('Admin user not found.', 404);

    if (currentUser && String(user._id) === String(currentUser._id)) {
      throw new AppError('Use your own change-password flow to update your password.', 400);
    }

    // New hash + passwordChangedAt stamp invalidates the target's existing sessions.
    user.passwordHash = await hashPassword(password);
    user.passwordChangedAt = new Date(Date.now() - 1000);
    await user.save();
    return user;
  };

  return { list, getByUsername, create, update, remove, setPassword };
}

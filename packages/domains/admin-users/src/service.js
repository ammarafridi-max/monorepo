import { AppError } from '@travel-suite/utils';

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureEmailIsUnique(AdminUser, email, excludeId = null) {
  if (!email) return;
  const existing = await AdminUser.findOne({
    email,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
  if (existing) throw new AppError('Email is already in use by another admin user.', 400);
}

async function ensureUsernameIsUnique(AdminUser, username, excludeId = null) {
  if (!username) return;
  const existing = await AdminUser.findOne({
    username,
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  }).lean();
  if (existing) throw new AppError('Username is already in use by another admin user.', 400);
}

async function ensureLastActiveAdminRemains(AdminUser, { userIdToChange, nextRole, nextStatus }) {
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
    throw new AppError('At least one active admin user must remain in the system.', 400);
  }
}

export function createAdminUsersService({ AdminUser }) {
  const getAdminUsers = async (query = {}) => {
    const filter = {};

    if (query.role && ['admin', 'agent', 'blog-manager'].includes(query.role)) {
      filter.role = query.role;
    }
    if (query.status && ['ACTIVE', 'INACTIVE'].includes(query.status)) {
      filter.status = query.status;
    }

    const search = String(query.search || query.q || '').trim();
    if (search) {
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [{ name: regex }, { username: regex }, { email: regex }];
    }

    return AdminUser.find(filter).sort({ createdAt: -1 });
  };

  const getAdminUserByUsername = async (username) => {
    if (!username) throw new AppError("Please provide an admin user's username", 400);
    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) throw new AppError('Could not find admin user!', 404);
    return user;
  };

  const createAdminUser = async (payload) => {
    const normalized = {
      ...payload,
      name: String(payload.name || '').trim(),
      username: String(payload.username || '').trim().toLowerCase(),
      email: String(payload.email || '').trim().toLowerCase(),
    };

    await ensureUsernameIsUnique(AdminUser, normalized.username);
    await ensureEmailIsUnique(AdminUser, normalized.email);

    return AdminUser.create(normalized);
  };

  const updateAdminUserByUsername = async (username, payload, currentUser) => {
    if (!username) throw new AppError("Please provide an admin user's username", 400);
    if (payload.password) throw new AppError('Please use /updateMyPassword to change password', 400);

    const existingUser = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!existingUser) throw new AppError('Admin user not found.', 404);

    const normalized = { ...payload };
    if (normalized.name !== undefined) normalized.name = String(normalized.name || '').trim();
    if (normalized.email !== undefined) normalized.email = String(normalized.email || '').trim().toLowerCase();

    const nextRole = normalized.role ?? existingUser.role;
    const nextStatus = normalized.status ?? existingUser.status;

    if (currentUser && String(existingUser._id) === String(currentUser._id)) {
      if (nextStatus === 'INACTIVE') throw new AppError('You cannot deactivate your own admin account.', 400);
      if (nextRole !== 'admin') throw new AppError('You cannot remove your own admin role.', 400);
    }

    await ensureEmailIsUnique(AdminUser, normalized.email, existingUser._id);
    await ensureLastActiveAdminRemains(AdminUser, {
      userIdToChange: existingUser._id,
      nextRole,
      nextStatus,
    });

    return AdminUser.findOneAndUpdate({ username: existingUser.username }, normalized, {
      runValidators: true,
      new: true,
    });
  };

  const deleteAdminUserByUsername = async (username, currentUser) => {
    if (!username) throw new AppError('Username is missing.', 400);

    const user = await AdminUser.findOne({ username: String(username).trim().toLowerCase() });
    if (!user) throw new AppError('Admin user not found with that username.', 404);

    if (currentUser && String(user._id) === String(currentUser._id)) {
      throw new AppError('You cannot delete your own admin account.', 400);
    }

    await ensureLastActiveAdminRemains(AdminUser, {
      userIdToChange: user._id,
      nextRole: 'agent',
      nextStatus: 'INACTIVE',
    });

    await AdminUser.findOneAndDelete({ username });
    return user;
  };

  const updateMyPassword = async (userId, { currentPassword, password, passwordConfirm }) => {
    if (!currentPassword || !password || !passwordConfirm)
      throw new AppError('Please provide currentPassword, password, and passwordConfirm.', 400);
    if (password !== passwordConfirm)
      throw new AppError('Passwords do not match.', 400);
    if (password.length < 8)
      throw new AppError('New password must be at least 8 characters.', 400);

    const user = await AdminUser.findById(userId).select('+password');
    if (!user) throw new AppError('User not found.', 404);

    const isCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCorrect) throw new AppError('Current password is incorrect.', 401);

    user.password = password;
    await user.save();
    return user;
  };

  return { getAdminUsers, getAdminUserByUsername, createAdminUser, updateAdminUserByUsername, deleteAdminUserByUsername, updateMyPassword };
}

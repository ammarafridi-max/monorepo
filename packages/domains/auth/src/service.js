import { AppError } from '@travel-suite/utils';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeName(value) {
  return String(value || '').trim();
}

/**
 * Creates the auth service with injected AdminUser model.
 * @param {{ AdminUser: import('mongoose').Model }} deps
 */
export function createAuthService({ AdminUser }) {
  const login = async ({ email, password }) => {
    if (!email || !password) throw new AppError('Email and password are required', 400);

    const user = await AdminUser.findOne({ email: normalizeEmail(email) }).select('+password');
    if (!user || !(await user.correctPassword(password, user.password))) {
      throw new AppError('Incorrect email or password', 401);
    }
    if (user.status === 'INACTIVE') throw new AppError('Admin user is inactive', 403);

    return user;
  };

  const updatePassword = async ({ userId, passwordCurrent, passwordNew }) => {
    if (!passwordCurrent || !passwordNew) {
      throw new AppError('Current password and new password are required', 400);
    }

    const user = await AdminUser.findById(userId).select('+password');
    if (!user) throw new AppError('Admin user not found', 404);

    if (!(await user.correctPassword(passwordCurrent, user.password))) {
      throw new AppError('Current password entered is wrong', 401);
    }

    user.password = passwordNew;
    await user.save();
    return user;
  };

  const getCurrentUser = async (userId) => {
    const user = await AdminUser.findById(userId);
    if (!user) throw new AppError('Your data was not found. Please try again later.', 404);
    return user;
  };

  const updateCurrentUser = async (userId, payload) => {
    if (payload.password) throw new AppError('Please use /update-password to change password', 403);

    const allowedFields = ['name', 'email'];
    const filtered = Object.keys(payload || {}).reduce((acc, key) => {
      if (allowedFields.includes(key)) acc[key] = payload[key];
      return acc;
    }, {});

    if (filtered.name  !== undefined) filtered.name  = normalizeName(filtered.name);
    if (filtered.email !== undefined) filtered.email = normalizeEmail(filtered.email);

    if (!Object.keys(filtered).length) throw new AppError('No valid profile fields provided', 400);

    const existing = await AdminUser.findById(userId);
    if (!existing) throw new AppError('Could not find admin user', 404);

    if (
      filtered.email &&
      filtered.email !== existing.email &&
      (await AdminUser.exists({ email: filtered.email, _id: { $ne: userId } }))
    ) {
      throw new AppError('Email is already in use by another admin user', 400);
    }

    return AdminUser.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true });
  };

  return { login, updatePassword, getCurrentUser, updateCurrentUser };
}

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { AppError } from '@travel-suite/utils';

export function createUserService({ User, jwtSecret, jwtExpiresIn, notifications }) {
  function signToken(id) {
    return jwt.sign({ id }, jwtSecret, { expiresIn: jwtExpiresIn });
  }

  const register = async ({ firstName, lastName, email, password }) => {
    if (!firstName || !lastName || !email || !password) throw new AppError('All fields are required', 400);
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw new AppError('Email already in use', 409);

    const user = await User.create({ firstName, lastName, email, password });

    if (notifications?.sendEmailVerification) {
      const token = user.createEmailVerifyToken();
      await user.save({ validateBeforeSave: false });
      await notifications.sendEmailVerification({ user, token }).catch(() => {});
    }

    const jwt = signToken(user._id);
    return { jwt, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified } };
  };

  const login = async ({ email, password }) => {
    if (!email || !password) throw new AppError('Email and password are required', 400);
    const user = await User.findOne({ email: email.toLowerCase().trim(), isActive: true }).select('+password');
    if (!user || !(await user.correctPassword(password))) throw new AppError('Incorrect email or password', 401);

    const token = signToken(user._id);
    return { token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified } };
  };

  const verifyEmail = async (rawToken) => {
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await User.findOne({ emailVerifyToken: hashed, emailVerifyExpires: { $gt: Date.now() } });
    if (!user) throw new AppError('Token is invalid or has expired', 400);

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const token = signToken(user._id);
    return { token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified } };
  };

  const forgotPassword = async ({ email, resetUrl }) => {
    const user = await User.findOne({ email: email?.toLowerCase()?.trim(), isActive: true });
    // Always resolve — don't leak whether email exists
    if (!user) return;

    const token = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    if (notifications?.sendPasswordReset) {
      await notifications.sendPasswordReset({ user, token, resetUrl }).catch(async () => {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
      });
    }
  };

  const resetPassword = async ({ token: rawToken, password }) => {
    if (!rawToken || !password) throw new AppError('Token and password are required', 400);
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashed, passwordResetExpires: { $gt: Date.now() } }).select('+password');
    if (!user) throw new AppError('Token is invalid or has expired', 400);

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const token = signToken(user._id);
    return { token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified } };
  };

  const getProfile = async (userId) => {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);
    return user;
  };

  const updateProfile = async (userId, { firstName, lastName }) => {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { firstName, lastName } },
      { new: true, runValidators: true },
    );
    if (!user) throw new AppError('User not found', 404);
    return user;
  };

  const updatePassword = async (userId, { currentPassword, newPassword }) => {
    if (!currentPassword || !newPassword) throw new AppError('Current and new passwords are required', 400);
    const user = await User.findById(userId).select('+password');
    if (!user || !(await user.correctPassword(currentPassword))) throw new AppError('Current password is incorrect', 401);
    user.password = newPassword;
    await user.save();

    const token = signToken(user._id);
    return { token, user: { _id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, isVerified: user.isVerified } };
  };

  const deleteAccount = async (userId, { password }) => {
    const user = await User.findById(userId).select('+password');
    if (!user || !(await user.correctPassword(password))) throw new AppError('Password is incorrect', 401);
    user.isActive = false;
    await user.save({ validateBeforeSave: false });
  };

  return { register, login, verifyEmail, forgotPassword, resetPassword, getProfile, updateProfile, updatePassword, deleteAccount };
}

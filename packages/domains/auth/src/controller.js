import { catchAsync } from '@travel-suite/utils';

export function createAuthController({ service, otpService, jwtUtils }) {
  const { signToken, createCookieOptions } = jwtUtils;

  const sendToken = (user, statusCode, res) => {
    const token = signToken(user._id, user.role);
    res.cookie('jwt', token, createCookieOptions());
    const userObj = user.toObject();
    delete userObj.password;
    // Set in memory by the pre-save hook on any password change; it is internal
    // bookkeeping for token invalidation, not something a client needs.
    delete userObj.passwordChangedAt;
    res.status(statusCode).json({ status: 'success', data: userObj });
  };

  const login = catchAsync(async (req, res) => {
    const user = await service.login(req.body);
    sendToken(user, 200, res);
  });

  const requestOtp = catchAsync(async (req, res) => {
    await otpService.requestOtp({ email: req.body.email, ip: req.ip });
    // Same body whether or not the account exists.
    res.status(200).json({
      status: 'success',
      message: 'If that email belongs to an admin account, a code is on its way.',
    });
  });

  const verifyOtp = catchAsync(async (req, res) => {
    const user = await otpService.verifyOtp({ email: req.body.email, code: req.body.code });
    sendToken(user, 200, res);
  });

  const forgotPassword = catchAsync(async (req, res) => {
    await otpService.requestOtp({ email: req.body.email, ip: req.ip, purpose: 'reset' });
    res.status(200).json({
      status: 'success',
      message: 'If that email belongs to an admin account, a reset code is on its way.',
    });
  });

  const resetPassword = catchAsync(async (req, res) => {
    const verified = await otpService.verifyOtp({
      email: req.body.email,
      code: req.body.code,
      purpose: 'reset',
    });
    const user = await service.resetPassword({ userId: verified._id, password: req.body.password });
    // Changing the password invalidates every existing session, so issue a fresh
    // token rather than logging out the person who just reset it.
    sendToken(user, 200, res);
  });

  const logout = catchAsync(async (req, res) => {
    res.cookie('jwt', '', { ...createCookieOptions(), expires: new Date(0) });
    res.status(200).json({ status: 'success', message: 'You have been logged out.' });
  });

  const updatePassword = catchAsync(async (req, res) => {
    const user = await service.updatePassword({
      userId: req.user.id,
      passwordCurrent: req.body.passwordCurrent || req.body.currentPassword,
      passwordNew: req.body.password,
    });
    sendToken(user, 200, res);
  });

  const currentUserInfo = catchAsync(async (req, res) => {
    const user = await service.getCurrentUser(req.user.id);
    res.status(200).json({ status: 'success', message: 'Admin user data fetched successfully', data: user });
  });

  const updateCurrentUser = catchAsync(async (req, res) => {
    const user = await service.updateCurrentUser(req.user.id, req.body);
    res.status(200).json({ status: 'success', message: 'Admin user updated successfully', data: user });
  });

  return { login, requestOtp, verifyOtp, forgotPassword, resetPassword, logout, updatePassword, currentUserInfo, updateCurrentUser };
}

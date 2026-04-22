import { catchAsync } from '@travel-suite/utils';

/**
 * Creates auth controller handlers with injected dependencies.
 * @param {{ service, jwtUtils: { signToken, createCookieOptions } }} deps
 */
export function createAuthController({ service, jwtUtils }) {
  const { signToken, createCookieOptions } = jwtUtils;

  const sendToken = (user, statusCode, res) => {
    const token = signToken(user._id, user.role);
    res.cookie('jwt', token, createCookieOptions());
    const userObj = user.toObject();
    delete userObj.password;
    res.status(statusCode).json({ status: 'success', data: userObj });
  };

  const login = catchAsync(async (req, res) => {
    const user = await service.login(req.body);
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

  return { login, logout, updatePassword, currentUserInfo, updateCurrentUser };
}

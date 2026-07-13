import { catchAsync } from './errors.js';
import { ADMIN_COOKIE } from './jwt.js';

/**
 * Create the auth controller. Thin: each handler calls the service and shapes the
 * HTTP response in the { status, data } envelope the frontend apiClient unwraps
 * (it reads `json.data`). `sendToken` signs a JWT, sets the httpOnly cookie, and
 * returns the sanitized user.
 *
 * @param {{ service, jwtUtils: { signToken, createCookieOptions } }} deps
 */
export function createAuthController({ service, jwtUtils }) {
  const { signToken, createCookieOptions } = jwtUtils;

  const sendToken = (user, statusCode, res) => {
    const token = signToken(user._id, user.role);
    res.cookie(ADMIN_COOKIE, token, createCookieOptions());
    const userObj = user.toObject();
    delete userObj.passwordHash; // select:false already, but never risk leaking it
    res.status(statusCode).json({ status: 'success', data: userObj });
  };

  const login = catchAsync(async (req, res) => {
    const user = await service.login(req.body);
    sendToken(user, 200, res);
  });

  const logout = catchAsync(async (req, res) => {
    // Overwrite the cookie with an immediately-expired sentinel.
    res.cookie(ADMIN_COOKIE, 'loggedout', { ...createCookieOptions(), expires: new Date(0) });
    res.status(200).json({ status: 'success', message: 'You have been logged out.' });
  });

  const currentUserInfo = catchAsync(async (req, res) => {
    const user = await service.getCurrentUser(req.user.id);
    res.status(200).json({ status: 'success', data: user });
  });

  const updateCurrentUser = catchAsync(async (req, res) => {
    const user = await service.updateCurrentUser(req.user.id, req.body);
    res.status(200).json({ status: 'success', message: 'Profile updated', data: user });
  });

  const updatePassword = catchAsync(async (req, res) => {
    const user = await service.updatePassword({
      userId: req.user.id,
      passwordCurrent: req.body.passwordCurrent || req.body.currentPassword,
      passwordNew: req.body.password,
    });
    // Re-issue the cookie so the current device stays logged in after the change.
    sendToken(user, 200, res);
  });

  return { login, logout, currentUserInfo, updateCurrentUser, updatePassword };
}

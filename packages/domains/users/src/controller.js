import { catchAsync } from '@travel-suite/utils';

export function createUserController({ service, cookieExpiresInDays, nodeEnv, appBaseUrl }) {
  const COOKIE_NAME = 'userJwt';

  function cookieOptions() {
    return {
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
      path: '/',
    };
  }

  function sendTokenCookie(res, token) {
    res.cookie(COOKIE_NAME, token, {
      ...cookieOptions(),
      expires: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 60 * 1000),
    });
  }

  function clearTokenCookie(res) {
    res.cookie(COOKIE_NAME, 'loggedout', {
      ...cookieOptions(),
      expires: new Date(Date.now() + 1000),
    });
  }

  const register = catchAsync(async (req, res) => {
    const { jwt: token, user } = await service.register(req.body);
    sendTokenCookie(res, token);
    res.status(201).json({ status: 'success', token, data: user });
  });

  const login = catchAsync(async (req, res) => {
    const { token, user } = await service.login(req.body);
    sendTokenCookie(res, token);
    res.json({ status: 'success', token, data: user });
  });

  const logout = (req, res) => {
    clearTokenCookie(res);
    res.json({ status: 'success' });
  };

  const verifyEmail = catchAsync(async (req, res) => {
    const { token, user } = await service.verifyEmail(req.params.token);
    sendTokenCookie(res, token);
    res.json({ status: 'success', token, data: user });
  });

  const forgotPassword = catchAsync(async (req, res) => {
    const base = String(appBaseUrl || '').replace(/\/+$/, '');
    const resetUrl = `${base}/api/users/reset-password`;
    await service.forgotPassword({ email: req.body.email, resetUrl });
    res.json({ status: 'success', message: 'If that email is registered, a reset link has been sent.' });
  });

  const resetPassword = catchAsync(async (req, res) => {
    const { token, user } = await service.resetPassword({ token: req.params.token, password: req.body.password });
    sendTokenCookie(res, token);
    res.json({ status: 'success', token, data: user });
  });

  const requestMagicLink = async (req, res) => {
    try {
      await service.requestMagicLink({ email: req.body.email });
      res.json({ status: 'success', message: 'If that email is valid, a sign-in link has been sent.' });
    } catch {
      res.json({ status: 'success', message: 'If that email is valid, a sign-in link has been sent.' });
    }
  };

  const verifyMagicLink = async (req, res) => {
    try {
      const { token } = await service.verifyMagicLink(req.params.token);
      sendTokenCookie(res, token);
      const base = String(appBaseUrl || '').replace(/\/+$/, '');
      res.redirect(`${base}/apply`);
    } catch (err) {
      const base = String(appBaseUrl || '').replace(/\/+$/, '');
      res.redirect(`${base}/apply/login?error=expired`);
    }
  };

  const getProfile = catchAsync(async (req, res) => {
    const user = await service.getProfile(req.user._id);
    res.json({ status: 'success', data: user });
  });

  const updateProfile = catchAsync(async (req, res) => {
    const user = await service.updateProfile(req.user._id, req.body);
    res.json({ status: 'success', data: user });
  });

  const updatePassword = catchAsync(async (req, res) => {
    const { token, user } = await service.updatePassword(req.user._id, req.body);
    sendTokenCookie(res, token);
    res.json({ status: 'success', token, data: user });
  });

  const deleteAccount = catchAsync(async (req, res) => {
    await service.deleteAccount(req.user._id, req.body || {});
    clearTokenCookie(res);
    res.status(204).send();
  });

  return { register, login, logout, verifyEmail, forgotPassword, resetPassword, requestMagicLink, verifyMagicLink, getProfile, updateProfile, updatePassword, deleteAccount };
}

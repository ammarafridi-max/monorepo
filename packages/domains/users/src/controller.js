export function createUserController({ service, cookieExpiresInDays, nodeEnv }) {
  function sendTokenCookie(res, token) {
    res.cookie('userJwt', token, {
      expires: new Date(Date.now() + cookieExpiresInDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      secure: nodeEnv === 'production',
      sameSite: 'lax',
    });
  }

  const register = async (req, res, next) => {
    try {
      const { jwt: token, user } = await service.register(req.body);
      sendTokenCookie(res, token);
      res.status(201).json({ status: 'success', token, data: user });
    } catch (err) {
      next(err);
    }
  };

  const login = async (req, res, next) => {
    try {
      const { token, user } = await service.login(req.body);
      sendTokenCookie(res, token);
      res.json({ status: 'success', token, data: user });
    } catch (err) {
      next(err);
    }
  };

  const logout = (req, res) => {
    res.cookie('userJwt', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
    res.json({ status: 'success' });
  };

  const verifyEmail = async (req, res, next) => {
    try {
      const { token, user } = await service.verifyEmail(req.params.token);
      sendTokenCookie(res, token);
      res.json({ status: 'success', token, data: user });
    } catch (err) {
      next(err);
    }
  };

  const forgotPassword = async (req, res, next) => {
    try {
      const resetUrl = `${req.protocol}://${req.get('host')}/api/users/reset-password`;
      await service.forgotPassword({ email: req.body.email, resetUrl });
      res.json({ status: 'success', message: 'If that email is registered, a reset link has been sent.' });
    } catch (err) {
      next(err);
    }
  };

  const resetPassword = async (req, res, next) => {
    try {
      const { token, user } = await service.resetPassword({ token: req.params.token, password: req.body.password });
      sendTokenCookie(res, token);
      res.json({ status: 'success', token, data: user });
    } catch (err) {
      next(err);
    }
  };

  const getProfile = async (req, res, next) => {
    try {
      const user = await service.getProfile(req.user._id);
      res.json({ status: 'success', data: user });
    } catch (err) {
      next(err);
    }
  };

  const updateProfile = async (req, res, next) => {
    try {
      const user = await service.updateProfile(req.user._id, req.body);
      res.json({ status: 'success', data: user });
    } catch (err) {
      next(err);
    }
  };

  const updatePassword = async (req, res, next) => {
    try {
      const { token, user } = await service.updatePassword(req.user._id, req.body);
      sendTokenCookie(res, token);
      res.json({ status: 'success', token, data: user });
    } catch (err) {
      next(err);
    }
  };

  const deleteAccount = async (req, res, next) => {
    try {
      await service.deleteAccount(req.user._id, req.body);
      res.cookie('userJwt', 'loggedout', { expires: new Date(Date.now() + 1000), httpOnly: true });
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  return { register, login, logout, verifyEmail, forgotPassword, resetPassword, getProfile, updateProfile, updatePassword, deleteAccount };
}

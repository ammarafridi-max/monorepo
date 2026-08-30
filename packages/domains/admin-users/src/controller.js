import { catchAsync, AppError } from '@travel-suite/utils';

/**
 * `select: false` on password only applies to QUERIES. A document returned by
 * create() still carries the freshly hashed value in memory, so any response
 * built from it must strip the field explicitly.
 */
function withoutPassword(user) {
  const obj = user?.toObject ? user.toObject() : { ...user };
  delete obj.password;
  return obj;
}

export function createAdminUsersController({ service }) {
  const getAdminUsers = catchAsync(async (req, res) => {
    const users = await service.getAdminUsers(req.query);
    res.status(200).json({ status: 'success', results: users.length, data: users });
  });

  const getAdminUser = catchAsync(async (req, res) => {
    const user = await service.getAdminUserByUsername(req.params.username);
    res.status(200).json({ status: 'success', data: user });
  });

  const createAdminUser = catchAsync(async (req, res) => {
    const user = await service.createAdminUser(req.body);
    res.status(201).json({ status: 'success', message: 'Admin user created successfully', data: withoutPassword(user) });
  });

  const updateAdminUser = catchAsync(async (req, res) => {
    const user = await service.updateAdminUserByUsername(req.params.username, req.body, req.user);
    res.status(200).json({ status: 'success', message: 'Admin user updated successfully', data: withoutPassword(user) });
  });

  const deleteAdminUser = catchAsync(async (req, res) => {
    await service.deleteAdminUserByUsername(req.params.username, req.user);
    res.status(204).json({ status: 'success', data: null });
  });

  const getPublicAuthors = catchAsync(async (req, res) => {
    const authors = await service.getPublicAuthors();
    res.status(200).json({ status: 'success', results: authors.length, data: authors });
  });

  const getPublicAuthor = catchAsync(async (req, res) => {
    const author = await service.getPublicAuthorBySlug(req.params.slug);
    res.status(200).json({ status: 'success', data: author });
  });

  const getMe = (req, res) => {
    res.status(200).json({ status: 'success', data: withoutPassword(req.user) });
  };

  const updateMe = catchAsync(async (req, res) => {
    const { name, email } = req.body;
    const user = await service.updateAdminUserByUsername(req.user.username, { name, email }, req.user);
    res.status(200).json({ status: 'success', data: withoutPassword(user) });
  });

  const updateMyPassword = catchAsync(async (req, res) => {
    const { passwordCurrent, currentPassword, password, passwordConfirm } = req.body;
    await service.updateMyPassword(req.user._id, { currentPassword: passwordCurrent || currentPassword, password, passwordConfirm });
    res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
  });

  const adminSetUserPassword = catchAsync(async (req, res) => {
    const { password, passwordConfirm } = req.body;
    await service.adminSetUserPassword(req.params.username, { password, passwordConfirm }, req.user);
    res.status(200).json({ status: 'success', message: 'Password updated successfully.' });
  });

  return { getMe, updateMe, updateMyPassword, getAdminUsers, getAdminUser, createAdminUser, updateAdminUser, deleteAdminUser, adminSetUserPassword, getPublicAuthors, getPublicAuthor };
}

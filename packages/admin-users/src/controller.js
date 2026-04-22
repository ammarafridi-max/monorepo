import { catchAsync, AppError } from '@travel-suite/utils';

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
    res.status(201).json({ status: 'success', message: 'Admin user created successfully', data: user });
  });

  const updateAdminUser = catchAsync(async (req, res) => {
    const user = await service.updateAdminUserByUsername(req.params.username, req.body, req.user);
    res.status(200).json({ status: 'success', message: 'Admin user updated successfully', data: user });
  });

  const deleteAdminUser = catchAsync(async (req, res) => {
    await service.deleteAdminUserByUsername(req.params.username, req.user);
    res.status(204).json({ status: 'success', data: null });
  });

  const getMe = (req, res) => {
    const userObj = req.user.toObject ? req.user.toObject() : { ...req.user };
    delete userObj.password;
    res.status(200).json({ status: 'success', data: userObj });
  };

  return { getMe, getAdminUsers, getAdminUser, createAdminUser, updateAdminUser, deleteAdminUser };
}

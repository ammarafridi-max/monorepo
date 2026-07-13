import { AppError } from './errors.js';

/**
 * Body validators for admin-user management. Same hand-rolled style as the other
 * admin validators. Roles are Picturesk's admin|support.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-z0-9][a-z0-9._-]{7,49}$/;
const ROLES = ['admin', 'support'];
const STATUSES = ['ACTIVE', 'INACTIVE'];

function normName(value) {
  const name = String(value || '').trim();
  if (!name) throw new AppError('Name is required', 400);
  if (name.length > 100) throw new AppError('Name must be at most 100 characters long', 400);
  return name;
}
function normEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) throw new AppError('Email is required', 400);
  if (!EMAIL_REGEX.test(email)) throw new AppError('Please provide a valid email address', 400);
  return email;
}
function normUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!username) throw new AppError('Username is required', 400);
  if (!USERNAME_REGEX.test(username)) {
    throw new AppError(
      'Username must be 8-50 characters, lowercase letters/numbers/._- (start alphanumeric)',
      400
    );
  }
  return username;
}
function normPassword(value) {
  const password = String(value || '');
  if (!password) throw new AppError('Password is required', 400);
  if (password.length < 8) throw new AppError('Password must be at least 8 characters long', 400);
  return password;
}
function normRole(value, fallback = 'support') {
  const role = String(value || fallback).trim().toLowerCase();
  if (!ROLES.includes(role)) throw new AppError(`Role must be one of: ${ROLES.join(', ')}`, 400);
  return role;
}
function normStatus(value, fallback = 'ACTIVE') {
  const status = String(value || fallback).trim().toUpperCase();
  if (!STATUSES.includes(status)) throw new AppError(`Status must be one of: ${STATUSES.join(', ')}`, 400);
  return status;
}

export const createAdminUserSchema = (body = {}) => ({
  name: normName(body.name),
  username: normUsername(body.username),
  email: normEmail(body.email),
  password: normPassword(body.password),
  role: normRole(body.role),
  status: normStatus(body.status),
});

export const updateAdminUserSchema = (body = {}) => {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(body, 'name')) payload.name = normName(body.name);
  if (Object.prototype.hasOwnProperty.call(body, 'email')) payload.email = normEmail(body.email);
  if (Object.prototype.hasOwnProperty.call(body, 'role')) payload.role = normRole(body.role);
  if (Object.prototype.hasOwnProperty.call(body, 'status')) payload.status = normStatus(body.status);
  if (!Object.keys(payload).length) throw new AppError('At least one field is required', 400);
  return payload;
};

export const setPasswordSchema = (body = {}) => {
  const password = normPassword(body.password);
  const passwordConfirm = String(body.passwordConfirm || '');
  if (password !== passwordConfirm) throw new AppError('Passwords do not match', 400);
  return { password, passwordConfirm };
};

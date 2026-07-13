import { AppError } from './errors.js';

/**
 * Request-body validators for the admin auth routes. Each is a pure function that
 * returns a normalized body or throws AppError(…, 400). Mirrors the reference's
 * hand-rolled validator style; email format is checked with a simple regex (same
 * shape the web app's isValidEmail uses) so we do not pull in the `validator` dep.
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_MIN = 8;

function normalizeEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!email) throw new AppError('Email is required', 400);
  if (!EMAIL_REGEX.test(email)) throw new AppError('Please provide a valid email address', 400);
  return email;
}

function normalizePassword(value, label = 'Password') {
  const password = String(value || '');
  if (!password) throw new AppError(`${label} is required`, 400);
  if (password.length < PASSWORD_MIN) {
    throw new AppError(`${label} must be at least ${PASSWORD_MIN} characters long`, 400);
  }
  return password;
}

export const loginSchema = (body = {}) => ({
  email: normalizeEmail(body.email),
  // Do not min-length the login password: an old/short password should fail auth
  // with "Incorrect email or password", not a validation error that leaks policy.
  password: String(body.password || ''),
});

export const updatePasswordSchema = (body = {}) => {
  const passwordCurrent = String(body.passwordCurrent || body.currentPassword || '');
  if (!passwordCurrent) throw new AppError('Current password is required', 400);

  const password = normalizePassword(body.password, 'New password');
  const passwordConfirm = String(body.passwordConfirm || '');
  if (!passwordConfirm) throw new AppError('Password confirmation is required', 400);
  if (password !== passwordConfirm) throw new AppError('Passwords do not match', 400);
  if (passwordCurrent === password) {
    throw new AppError('New password must be different from the current password', 400);
  }

  return { passwordCurrent, password, passwordConfirm };
};

export const updateCurrentAdminSchema = (body = {}) => {
  const payload = {};
  if (Object.prototype.hasOwnProperty.call(body, 'name')) {
    const name = String(body.name || '').trim();
    if (!name) throw new AppError('Name is required', 400);
    if (name.length > 100) throw new AppError('Name must be at most 100 characters long', 400);
    payload.name = name;
  }
  if (Object.prototype.hasOwnProperty.call(body, 'email')) {
    payload.email = normalizeEmail(body.email);
  }
  if (!Object.keys(payload).length) {
    throw new AppError('At least one profile field is required', 400);
  }
  return payload;
};

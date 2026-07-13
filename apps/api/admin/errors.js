/**
 * AppError + catchAsync, mirroring the reference travel-suite @travel-suite/utils.
 *
 * An AppError is an OPERATIONAL error (a 4xx the client caused) carrying its
 * statusCode. Services and validators throw it; controllers are wrapped in
 * catchAsync so a rejected promise flows to `next(err)`; the admin router mounts
 * `adminErrorHandler` at its end to render AppErrors as JSON. Non-operational
 * errors (bugs) become a generic 500 so we never leak internals.
 */

export class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Wrap an async route handler so a rejected promise is forwarded to next(err). */
export function catchAsync(fn) {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/**
 * Router-scoped error handler. Mounted at the END of the admin router so it only
 * catches errors from admin handlers, leaving the rest of the server's own
 * try/catch style untouched. Renders operational AppErrors with their status and
 * message; everything else is a generic 500.
 */
export function adminErrorHandler(err, req, res, _next) {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const status = err.status || (`${statusCode}`.startsWith('4') ? 'fail' : 'error');
  if (!err.isOperational) {
    console.error('[api] admin route error:', err);
  }
  res.status(statusCode).json({
    status,
    message: err.isOperational ? err.message : 'Something went wrong',
  });
}

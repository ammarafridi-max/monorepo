export function createErrorHandler({ logger, nodeEnv = 'production' }) {
  return (err, req, res, _next) => {
    if (err?.name === 'ValidationError' && err.errors) {
      const message = Object.values(err.errors)
        .map((e) => e.message)
        .join('. ');
      return res.status(400).json({ status: 'fail', message });
    }

    if (err?.name === 'CastError') {
      return res.status(400).json({ status: 'fail', message: `Invalid ${err.path}` });
    }

    if (err?.code === 11000) {
      const field = Object.keys(err.keyPattern ?? err.keyValue ?? {})[0];
      return res.status(409).json({
        status: 'fail',
        message: field ? `That ${field} is already in use` : 'That record already exists',
      });
    }

    const statusCode = err.statusCode ?? 500;
    const status = err.status ?? 'error';

    if (nodeEnv === 'development') {
      return res.status(statusCode).json({ status, message: err.message, stack: err.stack });
    }

    if (err.isOperational) {
      return res.status(statusCode).json({ status, message: err.message });
    }

    logger?.error('Unexpected error', { error: err, requestId: req.id });
    res.status(500).json({ status: 'error', message: 'Something went wrong' });
  };
}

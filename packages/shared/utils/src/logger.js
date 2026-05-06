const isDev = process.env.NODE_ENV !== 'production';

function serializeError(error) {
  if (!error) return undefined;
  return {
    name: error.name,
    message: error.message,
    statusCode: error.statusCode,
    stack: isDev ? error.stack : undefined,
  };
}

function cleanMeta(meta = {}) {
  return Object.entries(meta).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      acc[key] = value instanceof Error ? serializeError(value) : value;
    }
    return acc;
  }, {});
}

function writeLog(level, message, meta) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    env: process.env.NODE_ENV ?? 'development',
    message,
    ...cleanMeta(meta),
  };

  const serialized = JSON.stringify(payload);

  if (level === 'error') { console.error(serialized); return; }
  if (level === 'warn')  { console.warn(serialized);  return; }
  console.log(serialized);
}

export const logger = {
  info(message, meta)  { writeLog('info',  message, meta); },
  warn(message, meta)  { writeLog('warn',  message, meta); },
  error(message, meta) { writeLog('error', message, meta); },
};

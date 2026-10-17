import IORedis from 'ioredis';

export function createRedisConnection(url, options = {}) {
  if (!url) throw new Error('createRedisConnection: a Redis URL is required');
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    retryStrategy: (times) => Math.min(times * 1000, 30000),
    ...options,
  });
}

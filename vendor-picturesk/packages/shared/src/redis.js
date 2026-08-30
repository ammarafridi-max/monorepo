import IORedis from 'ioredis';

/**
 * Redis connection contract for BullMQ.
 *
 * api (producer) and worker (consumer) both build their Queue/Worker from a
 * connection created here, so their connection settings can never drift apart.
 *
 * IMPORTANT BullMQ gotcha: the ioredis connection MUST be created with
 * `maxRetriesPerRequest: null`. BullMQ blocks on long-lived commands (e.g.
 * BRPOPLPUSH) and will throw at runtime if this is not set.
 *
 * @param {string} url - the Redis connection string (REDIS_URL)
 * @param {import('ioredis').RedisOptions} [options] - extra ioredis options
 * @returns {import('ioredis').Redis} a fresh ioredis connection
 */
export function createRedisConnection(url, options = {}) {
  if (!url) throw new Error('createRedisConnection: a Redis URL is required');
  return new IORedis(url, {
    maxRetriesPerRequest: null,
    // Back off on reconnects so a Redis blip or outage never becomes a tight
    // reconnect loop hammering the server (and, on a metered Redis, the quota).
    // Exponential-ish, capped at 30s. Callers can still override via `options`.
    retryStrategy: (times) => Math.min(times * 1000, 30000),
    ...options,
  });
}

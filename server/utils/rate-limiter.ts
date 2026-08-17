import { ApiError } from "./api-error";

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window. */
  maxRequests: number;
  /** Time window duration in milliseconds. */
  windowMs: number;
}

interface RateLimitRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, RateLimitRecord>();

// Periodic memory cleanup every 5 minutes to prune expired rate limit records
if (typeof setInterval !== "undefined") {
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of memoryStore.entries()) {
      const activeTimestamps = record.timestamps.filter(
        (ts) => now - ts < 300000,
      );
      if (activeTimestamps.length === 0) {
        memoryStore.delete(key);
      } else {
        record.timestamps = activeTimestamps;
      }
    }
  }, 5 * 60 * 1000);

  if (cleanupInterval.unref) {
    cleanupInterval.unref();
  }
}

/**
 * Checks sliding-window rate limits for a given client identifier.
 * Throws a 429 Too Many Requests ApiError if the limit is exceeded.
 *
 * @param identifier - Client key (e.g. `user:${userId}:chat`).
 * @param config - Max requests and window duration.
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 20, windowMs: 60 * 1000 },
) {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  const record = memoryStore.get(identifier) || { timestamps: [] };
  const recentTimestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (recentTimestamps.length >= config.maxRequests) {
    const oldestInWindow = recentTimestamps[0];
    const retryAfterMs = oldestInWindow
      ? oldestInWindow + config.windowMs - now
      : config.windowMs;
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    throw ApiError.tooManyRequests(
      `Rate limit exceeded. Please try again in ${retryAfterSeconds} second${
        retryAfterSeconds === 1 ? "" : "s"
      }.`,
    );
  }

  recentTimestamps.push(now);
  memoryStore.set(identifier, { timestamps: recentTimestamps });
}

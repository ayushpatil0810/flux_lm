import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { ApiError } from "./api-error";
import { env } from "@/lib/env";

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
const ratelimiters = new Map<string, Ratelimit>();

let redisClient: Redis | null = null;
if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  redisClient = new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

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

function getRatelimiter(config: RateLimitConfig): Ratelimit | null {
  if (!redisClient) return null;

  const key = `${config.maxRequests}-${config.windowMs}`;
  if (!ratelimiters.has(key)) {
    const ratelimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
    });
    ratelimiters.set(key, ratelimiter);
  }
  return ratelimiters.get(key)!;
}

/**
 * Checks sliding-window rate limits for a given client identifier.
 * Throws a 429 Too Many Requests ApiError if the limit is exceeded.
 *
 * @param identifier - Client key (e.g. `user:${userId}:chat`).
 * @param config - Max requests and window duration.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 20, windowMs: 60 * 1000 },
) {
  const ratelimiter = getRatelimiter(config);
  
  if (ratelimiter) {
    const { success, reset } = await ratelimiter.limit(identifier);
    if (!success) {
      const retryAfterMs = reset - Date.now();
      const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

      throw ApiError.tooManyRequests(
        `Rate limit exceeded. Please try again in ${retryAfterSeconds} second${
          retryAfterSeconds === 1 ? "" : "s"
        }.`,
      );
    }
    return;
  }

  // Fallback to local memory limiter
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

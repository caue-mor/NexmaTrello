import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Create Redis client - falls back to memory storage if env vars not set
const redis = process.env.UPSTASH_REDIS_REST_URL
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Create rate limiters
export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "15 m"), // 5 attempts per 15 minutes
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    })
  : null;

export const apiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
      analytics: true,
      prefix: "@upstash/ratelimit/api",
    })
  : null;

/**
 * Apply rate limit based on IP address
 * Returns true if rate limit exceeded
 */
export async function checkRateLimit(
  ratelimiter: typeof authRateLimit,
  identifier: string
): Promise<{ success: boolean; remaining: number; reset: number }> {
  if (!ratelimiter) {
    // No rate limiting configured, allow request
    return { success: true, remaining: 999, reset: Date.now() };
  }

  const { success, limit, reset, remaining } = await ratelimiter.limit(identifier);

  return {
    success,
    remaining,
    reset,
  };
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIp) {
    return realIp;
  }

  // Fallback
  return "unknown";
}
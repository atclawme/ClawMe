import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { errToLogObject, logger } from "./logger";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Global Redis Client (Stateless)
 */
export const redis = (REDIS_URL && REDIS_TOKEN) 
  ? new Redis({ url: REDIS_URL, token: REDIS_TOKEN }) 
  : null;

/**
 * Rate Limiter Instance
 * Defaults to 10 requests per 10 seconds for sensitive routes
 */
export const ratelimiter = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "10 s"),
      analytics: true,
      prefix: "@clawme/ratelimit",
    })
  : null;

/**
 * Unified checkRateLimit function that works in both 
 * Production (Redis) and Development (In-memory) modes.
 */
export async function checkRateLimit(ip: string): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  // 1. Production Mode: Use Upstash Redis
  if (ratelimiter) {
    try {
      const result = await ratelimiter.limit(ip);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    } catch (error) {
      logger.error({ err: errToLogObject(error) }, "ratelimit: redis error (fail-open)");
      return { success: true }; // Fail open in production if Redis is down
    }
  }

  // 2. Mock/Development Mode: Fallback to local store
  // Note: We'll attempt to access the global store safely
  // @ts-ignore
  const store = global.__clawStore;
  if (!store) return { success: true };

  const now = Date.now();
  const windowMs = 60000; // 1 minute window for local
  const maxReq = 60; // 60 req/min for local
  
  const requests = (store.rateLimits.get(ip) || []).filter((t: number) => now - t < windowMs);
  
  if (requests.length >= maxReq) {
    return { success: false, limit: maxReq, remaining: 0 };
  }
  
  requests.push(now);
  store.rateLimits.set(ip, requests);
  return { success: true, limit: maxReq, remaining: maxReq - requests.length };
}

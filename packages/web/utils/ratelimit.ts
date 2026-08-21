/**
 * Tiny in-memory token-bucket rate limiter.
 *
 * Single-process only (fine for a one-box VPS deploy). Blunts bursts on the
 * expensive AI routes and on auth routes to keep runaway bills and brute-force
 * attempts in check. Not a substitute for a real distributed limiter.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();

// Periodically drop idle buckets so the map doesn't grow unbounded.
const IDLE_TTL_MS = 60 * 60 * 1000; // 1 hour
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < IDLE_TTL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (now - bucket.lastRefill > IDLE_TTL_MS) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Seconds until at least one token is available (0 when allowed). */
  retryAfter: number;
}

/**
 * Consume one token from `key`'s bucket.
 *
 * @param key        Unique identity (e.g. `ai:<userId>` or `login:<ip>`).
 * @param capacity   Max tokens (burst size).
 * @param refillPerSec Tokens replenished per second (sustained rate).
 */
export function rateLimit(
  key: string,
  capacity: number,
  refillPerSec: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: capacity, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill based on elapsed time.
  const elapsedSec = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(capacity, bucket.tokens + elapsedSec * refillPerSec);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return { allowed: true, retryAfter: 0 };
  }

  const needed = 1 - bucket.tokens;
  return { allowed: false, retryAfter: Math.ceil(needed / refillPerSec) };
}

/** Best-effort client IP from common proxy headers. */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

/** 429 JSON response with a Retry-After header. */
export function rateLimitResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please slow down." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

import { Redis } from "@upstash/redis";

// Per-IP rate limiting, on the Redis that is already provisioned.
//
// Hand-rolled rather than pulling in @upstash/ratelimit: this is a counter and
// an expiry, and the dependency would be a larger surface than the thing it
// replaces.
//
// FAILS OPEN, deliberately. If Redis is unreachable, a visitor can still submit
// the form. The thing being defended against is flooding; the cost of getting
// it wrong in the other direction is a real renter who cannot contact us.

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Vercel sets x-forwarded-for; the client's address is the first entry. The
 * rest of the chain is appended by proxies and must not be trusted, and a
 * caller can send their own header, so this is a throttle rather than an
 * identity check.
 */
export function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0].trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

/**
 * @returns {Promise<{ok: boolean, remaining?: number, retryAfter?: number}>}
 */
export async function rateLimit(request, { bucket, max, windowSeconds }) {
  const r = redis();
  if (!r) return { ok: true };                 // fail open — see note above

  const ip = clientIp(request);
  const key = `rentbolt:rl:${bucket}:${ip}`;

  try {
    const n = await r.incr(key);
    // Only set the expiry on the first hit of a window, or a steady trickle of
    // requests would keep pushing the window out and never reset.
    if (n === 1) await r.expire(key, windowSeconds);

    if (n > max) {
      const ttl = await r.ttl(key).catch(() => windowSeconds);
      return { ok: false, retryAfter: ttl > 0 ? ttl : windowSeconds };
    }
    return { ok: true, remaining: Math.max(0, max - n) };
  } catch {
    return { ok: true };                       // fail open
  }
}

/** 429 with the headers a well-behaved client will respect. */
export function tooMany(retryAfter, message) {
  return Response.json(
    { error: message || "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfter || 60) } },
  );
}

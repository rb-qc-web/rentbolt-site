import { Redis } from "@upstash/redis";

// Which buildings are hidden from the public site.
//
// Kept in Redis rather than as a monday column on purpose. A column would have
// to be created on all seven boards, and monday column ids are unique per
// board — which is the single most common source of bugs in this codebase.
// This also means hiding takes effect immediately instead of waiting for the
// ten-minute cache cycle.
//
// A hidden building is still in monday and still in the cache. It is filtered
// out at read time, so unhiding is instant too and nothing is ever destroyed.

const HIDDEN_KEY = "rentbolt:hidden:v1";

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/**
 * Slugs currently hidden, as a Set.
 *
 * Returns an EMPTY set if Redis is unreachable — the site keeps showing
 * everything rather than blanking out. The failure mode to avoid is a Redis
 * blip emptying the listings; a building staying visible a little longer is
 * recoverable, a site with no inventory is not.
 */
export async function getHiddenSlugs() {
  const r = redis();
  if (!r) return new Set();
  try {
    const members = await r.smembers(HIDDEN_KEY);
    return new Set(Array.isArray(members) ? members : []);
  } catch {
    return new Set();
  }
}

/** @returns {Promise<{ok: boolean, hidden?: boolean, error?: string}>} */
export async function setHidden(slug, hidden) {
  const r = redis();
  if (!r) return { ok: false, error: "Redis is not configured" };
  if (!slug) return { ok: false, error: "No building given" };
  try {
    if (hidden) await r.sadd(HIDDEN_KEY, slug);
    else await r.srem(HIDDEN_KEY, slug);
    return { ok: true, hidden: Boolean(hidden) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export function visibilityConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

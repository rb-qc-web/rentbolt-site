import { Redis } from "@upstash/redis";

// Photo galleries live in Redis, NOT in Monday.
//
// Monday was the wrong store for this: subitem boards don't reliably have the
// column we need (InvalidColumnIdException on long_text5), column ids differ
// per board, and writes to a missing column fail — sometimes silently. None of
// that is a problem we should keep solving. Redis is already provisioned, has
// no schema, and the site already reads from it on every request.
//
// These keys are permanent (no TTL) and are namespaced away from the buildings
// cache so clearing the cache never destroys photo work.

const KEY = id => `rentbolt:gallery:${id}`;

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function coerce(value) {
  if (!value) return [];
  const arr = typeof value === "string" ? safeParse(value) : value;
  return Array.isArray(arr) ? arr.filter(u => typeof u === "string" && u.startsWith("http")) : [];
}

function safeParse(s) {
  try { return JSON.parse(s); } catch { return []; }
}

export async function saveGallery(buildingId, urls) {
  const redis = getRedis();
  if (!redis) throw new Error("Redis is not configured");
  const clean = (urls || []).filter(u => typeof u === "string" && u.startsWith("http"));
  if (clean.length) await redis.set(KEY(buildingId), JSON.stringify(clean));
  else await redis.del(KEY(buildingId));
  return clean.length;
}

export async function getGallery(buildingId) {
  const redis = getRedis();
  if (!redis) return [];
  try { return coerce(await redis.get(KEY(buildingId))); } catch { return []; }
}

/** Batch lookup — one round trip for every building on the site. */
export async function getGalleries(buildingIds) {
  const redis = getRedis();
  const out = {};
  if (!redis || !buildingIds.length) return out;
  try {
    const values = await redis.mget(...buildingIds.map(KEY));
    buildingIds.forEach((id, i) => {
      const g = coerce(values[i]);
      if (g.length) out[id] = g;
    });
  } catch {
    // Non-fatal: buildings simply fall back to their Monday gallery.
  }
  return out;
}

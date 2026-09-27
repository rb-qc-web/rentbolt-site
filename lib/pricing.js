import { Redis } from "@upstash/redis";

// Pricing feed client. Contract: docs in pricing-api.md.
//
//   GET $RENTBOLT_PRICING_URL   Authorization: Bearer $RENTBOLT_PRICING_API_KEY
//
// Design points that matter:
//   · Server-side only. The key never reaches a browser and there is no public
//     proxy carrying it.
//   · At most one fetch per REFRESH_MS, not one per card or visitor.
//   · The snapshot lives in Redis so it survives serverless invocations. An
//     in-memory variable would be lost on every cold start.
//   · Any failure keeps the previous snapshot. Prices never vanish because a
//     fetch failed.
//   · A valid 200 REPLACES the snapshot wholesale, so rented or expired
//     inventory stops showing an old price.

const SNAPSHOT_KEY = "rentbolt:pricing:snapshot";
const TIMEOUT_MS = 10 * 1000;

// Refreshed once a day by default, to keep load off the inventory platform.
// Tunable without a deploy via RENTBOLT_PRICING_REFRESH_MINUTES; the trade-off
// is latency, since a price that changes just after a fetch is not reflected
// until the next one. /api/cache-refresh forces an immediate pull when
// inventory has just been reconfirmed and the site needs to show it now.
const REFRESH_MINUTES = Number(process.env.RENTBOLT_PRICING_REFRESH_MINUTES) || 1440;
const REFRESH_MS = Math.max(1, REFRESH_MINUTES) * 60 * 1000;

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

/** True once both env vars are set. Until then the site keeps its existing
 *  monday-subitem pricing, so shipping this ahead of the key is safe. */
export function pricingConfigured() {
  return Boolean(process.env.RENTBOLT_PRICING_URL && process.env.RENTBOLT_PRICING_API_KEY);
}

const isPosInt = v => Number.isInteger(v) && v > 0;

/**
 * Validate the WHOLE payload before it is allowed to replace the snapshot.
 * Partial acceptance is refused on purpose: half a price list published as
 * fact is worse than a stale one held back.
 */
function validate(payload) {
  if (!payload || typeof payload !== "object") return { ok: false, why: "not an object" };
  if (payload.currency !== "CAD") return { ok: false, why: `currency ${payload.currency}` };
  if (!Array.isArray(payload.buildings)) return { ok: false, why: "buildings not an array" };

  const prices = {};
  for (const b of payload.buildings) {
    if (typeof b?.mondayItemId !== "string" || !b.mondayItemId) {
      return { ok: false, why: "mondayItemId missing or not a string" };
    }
    if (b.startingPrice !== null && !isPosInt(b.startingPrice)) {
      return { ok: false, why: `startingPrice invalid for ${b.mondayItemId}` };
    }
    if (!Array.isArray(b.byBedroom)) {
      return { ok: false, why: `byBedroom not an array for ${b.mondayItemId}` };
    }
    const rows = [];
    for (const r of b.byBedroom) {
      if (!Number.isInteger(r?.bedrooms) || r.bedrooms < 0 || r.bedrooms > 4) {
        return { ok: false, why: `bedrooms out of range for ${b.mondayItemId}` };
      }
      if (!isPosInt(r?.startingPrice)) {
        return { ok: false, why: `bedroom price invalid for ${b.mondayItemId}` };
      }
      // Feed labels are ignored: it aggregates several unit types into one
      // bedroom count, so a label drawn from any single unit would
      // misdescribe the others grouped with it. See bedroomLabel below.
      rows.push({ bedrooms: r.bedrooms, startingPrice: r.startingPrice });
    }
    rows.sort((x, y) => x.bedrooms - y.bedrooms);
    prices[b.mondayItemId] = { startingPrice: b.startingPrice ?? null, byBedroom: rows };
  }
  return { ok: true, prices, generatedAt: payload.generatedAt || null };
}

async function readSnapshot() {
  const r = redis();
  if (!r) return null;
  try {
    const raw = await r.get(SNAPSHOT_KEY);
    if (!raw) return null;
    return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
    return null;
  }
}

/**
 * Current prices keyed by monday item id, refreshing at most once per
 * REFRESH_MS. Returns null when pricing is not configured — distinct from {},
 * which means "configured, and this building genuinely has no price".
 */
export async function getPricing() {
  if (!pricingConfigured()) return null;

  const existing = await readSnapshot();
  const age = existing?.fetchedAt ? Date.now() - existing.fetchedAt : Infinity;
  if (existing && age < REFRESH_MS) return existing.prices || {};

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(process.env.RENTBOLT_PRICING_URL, {
      headers: { Authorization: `Bearer ${process.env.RENTBOLT_PRICING_API_KEY}` },
      signal: controller.signal,
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const payload = await res.json();
    const check = validate(payload);
    if (!check.ok) throw new Error(`invalid payload: ${check.why}`);

    const snap = { fetchedAt: Date.now(), generatedAt: check.generatedAt, prices: check.prices };
    const r = redis();
    if (r) {
      try {
        // No TTL: the snapshot must outlive any outage.
        await r.set(SNAPSHOT_KEY, JSON.stringify(snap));
      } catch (err) {
        console.warn("[Pricing] could not persist snapshot:", err.message);
      }
    }

    const priced = Object.values(check.prices).filter(p => p.startingPrice != null).length;
    console.log(`[Pricing] refreshed: ${Object.keys(check.prices).length} buildings, ${priced} priced`);
    return check.prices;
  } catch (err) {
    // Redacted on purpose: never log the key or the raw response body.
    const why = err.name === "AbortError" ? "timeout" : err.message;
    console.error(`[Pricing] refresh failed (${why}) — keeping last good snapshot`);
    return existing?.prices || {};
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Mark the snapshot stale so the next request refetches, WITHOUT discarding it.
 * Deleting the snapshot would throw away the last known good prices, so a feed
 * outage straight afterwards would blank every price on the site.
 */
export async function invalidatePricing() {
  const r = redis();
  if (!r) return false;
  try {
    const snap = await readSnapshot();
    if (!snap) return false;
    await r.set(SNAPSHOT_KEY, JSON.stringify({ ...snap, fetchedAt: 0 }));
    return true;
  } catch {
    return false;
  }
}

/** Display label generated here, not taken from the feed. The feed groups
 *  several unit types under one bedroom count, so "2 Bed + Den" borrowed from
 *  one unit would misdescribe the plain 2-beds beside it. */
export function bedroomLabel(n) {
  if (n === 0) return "Studio";
  if (n >= 4) return "4+ Bed";
  return `${n} Bed`;
}

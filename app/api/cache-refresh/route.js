import { Redis } from "@upstash/redis";
import { invalidatePricing } from "@/lib/pricing";
import { checkAuthLimited } from "../admin/_auth";
import { rateLimit, tooMany } from "@/lib/rateLimit";

const CACHE_KEY = "rentbolt:buildings:v27";

// Clears the buildings cache so the next page view pulls fresh data from
// monday. Run from the button on /admin/health.
//
// This used to read:
//
//     if (SECRET && searchParams.get("secret") !== SECRET) return 401;
//
// which is no gate at all when CACHE_REFRESH_SECRET is unset — the same shape
// of bug as ADMIN_PASSWORD being blank. Anyone could delete the cache in a
// loop, and every deletion forces a full refetch across all seven boards.
// That is both a free way to make the site slow for everyone and a free way to
// burn monday's query-complexity budget, which is what took Montreal down
// before.
//
// Now: admin password required, no exceptions, and throttled on top, because a
// refresh is expensive even when it is us asking.
export async function GET(request) {
  const auth = await checkAuthLimited(request);
  if (!auth.ok) return auth.response || Response.json({ error: auth.error }, { status: auth.status });

  // Authorised but still capped. A legitimate refresh is a once-in-a-while
  // action; a dozen in five minutes is a mistake or a stuck script.
  const rl = await rateLimit(request, { bucket: "cacherefresh", max: 6, windowSeconds: 300 });
  if (!rl.ok) return tooMany(rl.retryAfter, "Refresh already run several times. Wait a moment.");

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return Response.json({ error: "Redis not configured" }, { status: 500 });
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.del(CACHE_KEY);

    // Marks the pricing snapshot stale rather than deleting it, so the last
    // known good prices survive if the very next feed fetch fails.
    const pricingQueued = await invalidatePricing();

    return Response.json({
      success: true,
      message: "Cache cleared. Next request will fetch fresh data from Monday.",
      pricing: pricingQueued
        ? "Pricing will also refetch on the next request."
        : "No pricing snapshot to refresh (feed not configured, or never fetched).",
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

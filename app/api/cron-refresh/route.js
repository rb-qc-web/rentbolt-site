import { Redis } from "@upstash/redis";
import { fetchBuildingsFromMonday } from "@/lib/monday";

const CACHE_KEY = "rentbolt:buildings:v15";
const CACHE_TTL = 60 * 15;

export const dynamic = "force-dynamic";

export async function GET(request) {
  // Vercel cron sends this header — reject anything else
  const isVercelCron = request.headers.get("x-vercel-cron") === "1";
  const isSecret = request.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;
  
  if (!isVercelCron && !isSecret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return Response.json({ error: "Redis not configured" }, { status: 500 });
  }

  const start = Date.now();

  try {
    const buildings = await fetchBuildingsFromMonday();

    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    await redis.set(CACHE_KEY, JSON.stringify(buildings), { ex: CACHE_TTL });

    const ms = Date.now() - start;
    const failures = buildings.boardFailures || [];
    console.log(`[Cron] Cache refreshed — ${buildings.length} buildings in ${ms}ms`);
    return Response.json({
      success: true,
      buildings: buildings.length,
      ms,
      boardFailures: failures,
      warning: failures.length ? `${failures.length} board(s) failed to load` : undefined,
    });
  } catch (err) {
    console.error("[Cron] Refresh failed:", err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

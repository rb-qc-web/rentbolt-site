import { Redis } from "@upstash/redis";

const CACHE_KEY = "rentbolt:buildings:v1";
const SECRET = process.env.CACHE_REFRESH_SECRET;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  
  // Basic secret protection so random people can't spam it
  if (SECRET && searchParams.get("secret") !== SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.UPSTASH_REDIS_REST_URL) {
    return Response.json({ error: "Redis not configured" }, { status: 500 });
  }

  try {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    await redis.del(CACHE_KEY);
    return Response.json({ success: true, message: "Cache cleared. Next request will fetch fresh data from Monday." });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

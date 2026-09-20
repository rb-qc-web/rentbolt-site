import { Redis } from "@upstash/redis";
import { checkAuth } from "../_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Saved-list leads, newest first. Same ADMIN_PASSWORD as the photo tool.
export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const r = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const ids = await r.zrange("rentbolt:leads", 0, 99, { rev: true });
    if (!ids?.length) return Response.json({ total: 0, leads: [] });

    const raw = await r.mget(...ids.map(id => `rentbolt:lead:${id}`));
    const leads = raw
      .map(v => (typeof v === "string" ? JSON.parse(v) : v))
      .filter(Boolean);

    return Response.json({ total: leads.length, leads });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

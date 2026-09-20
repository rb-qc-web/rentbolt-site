import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// A saved list plus an email is a far better lead than a contact form: it
// says which specific buildings someone wants. Stored in Redis, which is
// already provisioned; when the lead forms are wired to Monday these can be
// migrated with the rest.

function redis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }

  const email = String(body?.email || "").trim().toLowerCase();
  const buildings = Array.isArray(body?.buildings) ? body.buildings.slice(0, 50) : [];
  const note = String(body?.note || "").slice(0, 500);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!buildings.length) {
    return Response.json({ error: "Your list is empty." }, { status: 400 });
  }

  const r = redis();
  if (!r) return Response.json({ error: "Could not save right now." }, { status: 503 });

  const lead = {
    email,
    note,
    buildings,
    createdAt: new Date().toISOString(),
  };

  try {
    // Sorted set keyed by time so the admin view can page newest-first.
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await r.set(`rentbolt:lead:${id}`, JSON.stringify(lead));
    await r.zadd("rentbolt:leads", { score: Date.now(), member: id });
    return Response.json({ ok: true });
  } catch (err) {
    return Response.json({ error: "Could not save right now." }, { status: 500 });
  }
}

import { saveLead, forwardToMonday, leadsConfigured } from "@/lib/leadStore";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// A saved list plus an email is the best lead the site produces: it says which
// specific buildings someone wants. Shares the store and the Monday forward
// with /api/leads so all four forms land in one place.

const str = (v, max) => String(v ?? "").trim().slice(0, max);

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }

  const name = str(body?.name, 120);
  const email = str(body?.email, 160).toLowerCase();
  const phone = str(body?.phone, 40);
  const moveIn = str(body?.moveIn, 20);
  const flexible = Boolean(body?.flexible);
  const note = str(body?.note, 1500);

  const buildings = (Array.isArray(body?.buildings) ? body.buildings : [])
    .slice(0, 50)
    .map(b => ({
      id: str(b?.id, 40),
      name: str(b?.name, 160),
      city: str(b?.city, 60),
      neighbourhood: str(b?.neighbourhood, 80),
      price: Number.isFinite(Number(b?.price)) ? Number(b.price) : null,
    }));

  if (!name) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (!buildings.length) {
    return Response.json({ error: "Your list is empty." }, { status: 400 });
  }

  if (!leadsConfigured()) {
    return Response.json(
      { error: "We couldn't send your list right now. Please email rent@rentbolt.ca and we'll pick it up." },
      { status: 503 },
    );
  }

  let saved;
  try {
    saved = await saveLead({
      kind: "saved-list",
      name,
      email,
      phone,
      moveIn: flexible ? "Flexible" : moveIn,
      flexible,
      note,
      buildings,
    });
  } catch {
    return Response.json({ error: "We couldn't send your list right now. Please try again in a moment." }, { status: 500 });
  }

  const fwd = await forwardToMonday(saved);
  if (!fwd.forwarded && fwd.reason !== "not configured") {
    console.error("[leads] Monday forward failed:", fwd.reason);
  }

  return Response.json({ ok: true });
}

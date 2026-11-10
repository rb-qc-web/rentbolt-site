import { checkAuthLimited } from "../_auth";
import { fetchAllBuildings } from "@/lib/monday";
import { setHidden, visibilityConfigured } from "@/lib/visibility";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Which buildings are on the site, and the switch to take one off it.
//
// Reads the cached list rather than monday directly — this is a toggle, not a
// sync, and there is no reason to spend query budget to draw a list of names.

export async function GET(request) {
  const auth = await checkAuthLimited(request);
  if (!auth.ok) return auth.response || Response.json({ error: auth.error }, { status: auth.status });

  if (!visibilityConfigured()) {
    return Response.json({ error: "Redis is not configured, so visibility cannot be stored." }, { status: 503 });
  }

  try {
    const all = await fetchAllBuildings();
    const buildings = all
      .map(b => ({
        slug: b.slug,
        name: b.name,
        city: b.city,
        hidden: Boolean(b.hidden),
        // The two reasons you would actually want to hide something, surfaced
        // so the list doubles as a shortlist of what to take down. These are
        // exactly the Ajax buildings with no unit subitems.
        noUnits: !(b.beds?.length),
        noPrice: !b.startingPrice,
      }))
      .sort((a, b) => a.city.localeCompare(b.city) || a.name.localeCompare(b.name));

    return Response.json({
      total: buildings.length,
      hidden: buildings.filter(b => b.hidden).length,
      buildings,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const auth = await checkAuthLimited(request);
  if (!auth.ok) return auth.response || Response.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request" }, { status: 400 }); }

  const slug = String(body?.slug || "").trim();
  if (!slug) return Response.json({ error: "No building given" }, { status: 400 });

  // Only a building we actually serve can be toggled, so a stray slug cannot
  // quietly accumulate in the hidden set forever.
  const all = await fetchAllBuildings();
  if (!all.some(b => b.slug === slug)) {
    return Response.json({ error: "Unknown building" }, { status: 400 });
  }

  const result = await setHidden(slug, Boolean(body?.hidden));
  if (!result.ok) return Response.json({ error: result.error }, { status: 500 });

  return Response.json({ ok: true, slug, hidden: result.hidden });
}

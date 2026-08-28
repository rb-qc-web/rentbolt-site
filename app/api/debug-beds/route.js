import { fetchBuildings } from "@/lib/monday";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Shows what the SITE actually has for each building after parsing and
// caching — not what Monday holds. That distinction matters: a stale cache
// and a parsing bug look identical from the search page.
export async function GET(request) {
  const city = new URL(request.url).searchParams.get("city");
  const buildings = await fetchBuildings();

  const rows = buildings
    .filter(b => !city || b.city.toLowerCase() === city.toLowerCase())
    .map(b => ({
      name: b.publicName || b.name,
      city: b.city,
      bedrooms: b.bedrooms || [],
      unitTypes: (b.unitPrices || []).map(u => u.type),
      matches: {
        studio: (b.bedrooms || []).includes(0),
        oneBR:  (b.bedrooms || []).includes(1),
        twoBR:  (b.bedrooms || []).includes(2),
        threePlus: (b.bedrooms || []).some(x => x >= 3),
      },
    }));

  const counts = rows.reduce((a, r) => {
    if (r.matches.studio) a.studio++;
    if (r.matches.oneBR) a.oneBR++;
    if (r.matches.twoBR) a.twoBR++;
    if (r.matches.threePlus) a.threePlus++;
    if (!r.bedrooms.length) a.noBedroomData++;
    return a;
  }, { studio: 0, oneBR: 0, twoBR: 0, threePlus: 0, noBedroomData: 0 });

  return Response.json({
    city: city || "all",
    totalShown: rows.length,
    howManyMatchEachFilter: counts,
    note: "noBedroomData = building has no unit subitems and no unitsAvail dropdown, so every bed filter excludes it.",
    buildings: rows,
  });
}

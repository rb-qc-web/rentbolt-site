// Internal diagnostic. Behind ADMIN_PASSWORD because these endpoints answer
// questions about the inventory that a competitor would also like answered:
// which buildings exist, what they are really called, where they are, which
// have no photos. The public site needs none of them.
import { fetchBuildings } from "@/lib/monday";
import { hasNeighbourhoods } from "@/lib/neighbourhoods";
import { checkAuth } from "../admin/_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// What neighbourhood filtering would actually look like against live inventory:
// which boroughs have listings, how many, and how many buildings resolve to
// nothing. Run before building any UI — a dropdown of 38 boroughs where half
// return zero results is worse than no filter at all.
export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const city = new URL(request.url).searchParams.get("city") || "Montreal";
  const buildings = await fetchBuildings();
  const inCity = buildings.filter(b => b.city === city);

  const counts = {};
  const unresolved = [];
  for (const b of inCity) {
    const n = b.neighbourhood;
    if (!n) { unresolved.push(b.publicName || b.name); continue; }
    counts[n] = (counts[n] || 0) + 1;
  }

  const ranked = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return Response.json({
    city,
    cityHasPolygonData: hasNeighbourhoods(city),
    activeBuildings: inCity.length,
    resolved: inCity.length - unresolved.length,
    unresolvedCount: unresolved.length,
    distinctNeighbourhoods: ranked.length,
    withAtLeast3: ranked.filter(r => r.count >= 3).length,
    onlyOneListing: ranked.filter(r => r.count === 1).map(r => r.name),
    neighbourhoods: ranked,
    unresolved: unresolved.slice(0, 20),
  });
}

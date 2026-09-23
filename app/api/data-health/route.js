import { fetchBuildings } from "@/lib/monday";
import { hasNeighbourhoods } from "@/lib/neighbourhoods";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// One place to see what's missing across every board.
//
// Replaces having to remember five separate diagnostics. Reads through the
// same cache the site uses, so it reports what visitors actually get — not
// what monday holds.
//
// Ordered by what costs the most: a listing nobody can find is worse than one
// with no photos.

export async function GET(request) {
  const url = new URL(request.url);
  const cityFilter = url.searchParams.get("city");
  const names = url.searchParams.get("names") === "1";

  const all = await fetchBuildings();
  const buildings = cityFilter
    ? all.filter(b => b.city.toLowerCase() === cityFilter.toLowerCase())
    : all;

  const cities = [...new Set(buildings.map(b => b.city))].sort();
  const byCity = {};

  const ISSUES = [
    {
      key: "invisibleNoCoordinates",
      why: "No location set — no map pin, no search result. The listing is unreachable.",
      test: b => !b.lat || !b.lng || (b.lat === 0 && b.lng === 0),
    },
    {
      key: "noPricing",
      why: "No price. Card shows no 'from' figure and the listing hero loses its strongest element.",
      test: b => !(b.startingPrice > 0),
    },
    {
      key: "noUnitTypes",
      why: "No unit subitems — excluded from every bed filter, and shows 'Mixed unit types'.",
      test: b => !(b.bedrooms?.length > 0),
    },
    {
      key: "noPhotos",
      why: "Falls back to a generic city skyline shared with every other listing.",
      test: b => !(b.photoGallery?.length > 0),
    },
    {
      key: "noDescription",
      why: "Listing page has no copy about the building.",
      test: b => !b.description || String(b.description).trim().length < 20,
    },
    {
      key: "noNeighbourhood",
      why: "Not reachable via the neighbourhood filter.",
      test: b => !b.neighbourhood,
      // Only meaningful where we have polygons. Without this, Ottawa, London
      // and KW scored 0% completeness because every building failed a check
      // that reflects a missing map file, not bad data in monday.
      appliesTo: city => hasNeighbourhoods(city),
    },
  ];

  for (const city of cities) {
    const list = buildings.filter(b => b.city === city);
    const issues = {};
    const applicable = ISSUES.filter(i => !i.appliesTo || i.appliesTo(city));
    for (const issue of applicable) {
      const hit = list.filter(issue.test);
      issues[issue.key] = names
        ? { count: hit.length, why: issue.why, buildings: hit.map(b => b.publicName || b.name) }
        : { count: hit.length, why: issue.why };
    }

    // A listing with none of the above is fully populated.
    const clean = list.filter(b => !applicable.some(i => i.test(b))).length;

    byCity[city] = {
      activeBuildings: list.length,
      neighbourhoodDataAvailable: hasNeighbourhoods(city),
      fullyPopulated: clean,
      completeness: list.length ? `${Math.round((clean / list.length) * 100)}%` : "n/a",
      issues,
    };
  }

  const totals = {};
  for (const issue of ISSUES) {
    totals[issue.key] = cities.reduce(
      (n, c) => n + (byCity[c].issues[issue.key]?.count || 0), 0
    );
  }

  return Response.json({
    activeBuildings: buildings.length,
    fullyPopulated: cities.reduce((n, c) => n + byCity[c].fullyPopulated, 0),
    totals,
    tip: "Add ?names=1 to list the affected buildings, or ?city=Montreal to narrow.",
    byCity,
  });
}

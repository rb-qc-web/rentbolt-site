import { fetchBuildings } from "@/lib/monday";
import { pricingConfigured } from "@/lib/pricing";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Is the pricing feed on, and what is it actually doing to the site?
// Reads through the same cache the pages use, so it reports what visitors get.
export async function GET(request) {
  const names = new URL(request.url).searchParams.get("names") === "1";
  const configured = pricingConfigured();

  const buildings = await fetchBuildings();
  const priced = buildings.filter(b => b.startingPrice > 0);
  const unpriced = buildings.filter(b => !(b.startingPrice > 0));

  const byCity = {};
  for (const b of buildings) {
    const row = (byCity[b.city] ||= { active: 0, priced: 0, contactUs: [] });
    row.active++;
    if (b.startingPrice > 0) row.priced++;
    else row.contactUs.push(b.publicName || b.name);
  }
  for (const city of Object.keys(byCity)) {
    const r = byCity[city];
    r.coverage = r.active ? `${Math.round((r.priced / r.active) * 100)}%` : "n/a";
    if (!names) r.contactUs = r.contactUs.length;
  }

  return Response.json({
    feedConfigured: configured,
    meaning: configured
      ? "Prices come from the inventory feed. Monday subitem prices are ignored."
      : "RENTBOLT_PRICING_URL / RENTBOLT_PRICING_API_KEY not set — still using Monday subitem prices.",
    activeBuildings: buildings.length,
    withPrice: priced.length,
    showingContactUs: unpriced.length,
    coverage: buildings.length ? `${Math.round((priced.length / buildings.length) * 100)}%` : "n/a",
    tip: "Add ?names=1 to list the buildings showing 'Contact us for pricing'.",
    byCity,
  });
}

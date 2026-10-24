// Bedroom counts inferred from a unit type name ("2 Bed + Den", "Studio").
//
// Shared deliberately: the bed filter and the per-bedroom price lookup must
// agree on what "2 BR" means, or the search can offer a building under a bed
// filter and then price it from a different unit.

/** Bedroom numbers a single unit-type name refers to. 4 means "4 or more". */
export function bedsForType(name) {
  const found = new Set();
  const n = String(name ?? "").toLowerCase().trim();
  if (!n) return [];

  // A private room is not a bedroom count — skip rather than mislabel.
  if (/\broom(s)? for rent\b/.test(n) || n === "room") return [];

  if (/\b(studio|bachelor)\b/.test(n)) found.add(0);

  // Match the number attached to "bed"/"bedroom" so "2 Bed 1 Bath" doesn't
  // also register as a 1-bedroom.
  const m = n.match(/(\d+)\s*\+?\s*bed/);
  if (m) {
    const count = parseInt(m[1], 10);
    if (Number.isFinite(count)) found.add(Math.min(count, 4));
  }
  if (/4\s*\+/.test(n)) found.add(4);

  return [...found].sort((a, b) => a - b);
}

/** Every bedroom count across a list of {type, price} rows. */
export function bedroomsFromUnitTypes(unitPrices) {
  const found = new Set();
  for (const u of unitPrices || []) {
    for (const n of bedsForType(u?.type)) found.add(n);
  }
  return [...found].sort((a, b) => a - b);
}

/** The bed filter's 3 means "3 or more", so it has to match upward. */
export function bedMatches(bedFilter, n) {
  return bedFilter === 3 ? n >= 3 : n === bedFilter;
}

/**
 * Cheapest listed price for one bedroom count, or null when that unit type has
 * no price of its own.
 *
 * This is the whole point of the module: `startingPrice` is the cheapest unit
 * in the building of ANY type, so filtering a 2-bedroom search by budget
 * against it judged Le Vittorio's $2,625 two-bedroom by its $1,525 studio and
 * dropped the building.
 */
export function priceForBed(building, bedFilter) {
  if (bedFilter < 0) return null;
  const prices = (building?.unitPrices || [])
    .filter(u => Number(u?.price) > 0 && bedsForType(u.type).some(n => bedMatches(bedFilter, n)))
    .map(u => Number(u.price));
  return prices.length ? Math.min(...prices) : null;
}

/**
 * The price a building should be judged and displayed at for the current
 * search. Falls back to the building-wide figure when that bedroom type has no
 * price, so a data gap never hides a listing outright.
 */
export function effectivePrice(building, bedFilter) {
  return priceForBed(building, bedFilter) ?? Number(building?.startingPrice) ?? 0;
}

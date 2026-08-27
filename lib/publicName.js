// Public-facing identity for a building.
// Competitors must not be able to identify the exact building from the site,
// so the street number, the landlord's building name, and the exact
// coordinates are stripped server-side and never sent to the browser.

/** "1445 Rue du Fort, Montréal, QC" -> "Rue du Fort" */
export function streetFromAddress(address) {
  if (!address) return "";
  const firstPart = address.split(",")[0].trim();
  // Drop leading civic numbers, ranges ("1126-1154"), and pairs ("3331 & 3341")
  const stripped = firstPart.replace(/^[\d\s\-–—&/#.]+/u, "").trim();
  return stripped || firstPart;
}

/**
 * Public display name. Street name only + "Apartments".
 * A manual override in Monday always wins when present.
 */
export function getPublicName(building) {
  if (building?.publicNameOverride?.trim()) return building.publicNameOverride.trim();

  const street = streetFromAddress(building?.address);
  if (street) return `${street} Apartments`;

  // No usable address — fall back to area/city, never the landlord's name.
  const place = building?.area || building?.city;
  return place ? `${place} Apartments` : "Apartments";
}

/** Stable hash so a building's fuzzed pin never moves between page loads. */
function hashCode(str) {
  let h = 0;
  for (let i = 0; i < String(str).length; i++) {
    h = (h << 5) - h + String(str).charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Deterministically offset coordinates by ~150-300m.
 * Right block, wrong door. Same building always lands on the same spot.
 */
export function approxCoords(lat, lng, seed) {
  // Buildings with no location parse to exactly 0 upstream (`parseFloat(x) || 0`).
  // They must stay 0 — offsetting them produces a truthy value that slips past
  // the map's "has coordinates" check and drops a pin on Null Island (0,0),
  // which then drags fitBounds across the Atlantic.
  const invalid =
    typeof lat !== "number" || typeof lng !== "number" ||
    !Number.isFinite(lat) || !Number.isFinite(lng) ||
    (lat === 0 && lng === 0);
  if (invalid) return { lat, lng };
  const h = hashCode(seed);
  const angle = ((h % 360) * Math.PI) / 180;
  const distM = 150 + (h % 150);
  const dLat = (distM * Math.cos(angle)) / 111320;
  const dLng = (distM * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180) || 1);
  return {
    lat: Number((lat + dLat).toFixed(5)),
    lng: Number((lng + dLng).toFixed(5)),
  };
}

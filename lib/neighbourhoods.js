import boroughsMontreal from "../data/boroughs-montreal.json";
import neighbourhoodsToronto from "../data/boroughs-toronto.json";

// Neighbourhood assignment from coordinates.
//
// Runs SERVER-SIDE in parseBuilding, against the building's TRUE coordinates
// before they are fuzzed for the public site. Two reasons:
//   · the polygon file never ships to the browser (446KB saved per visit)
//   · assignment is accurate. Done client-side on the ~200m fuzzed pins, a
//     building near a boundary could be filed under the wrong borough.
//
// A city gets neighbourhood filtering only if it has a file here, so adding
// Toronto or Ottawa later is a data change, not a code change.
const SETS = {
  Montreal: boroughsMontreal,
  // City of Toronto's 140 official neighbourhoods. Note this covers Toronto
  // proper only — buildings on the Toronto board that sit in Mississauga,
  // Brampton or elsewhere in the GTA resolve to nothing, same as before.
  Toronto: neighbourhoodsToronto,
};

/** True if the city has neighbourhood data at all. */
export function hasNeighbourhoods(city) {
  return Boolean(SETS[city]);
}

// Ray casting. No dependency needed and the polygon count is small.
function pointInRing(x, y, ring) {
  let inside = false;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    if ((y1 > y) !== (y2 > y) && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1) {
      inside = !inside;
    }
  }
  return inside;
}

function pointInPolygon(x, y, poly) {
  // poly[0] is the outer ring; any further rings are holes.
  if (!pointInRing(x, y, poly[0])) return false;
  for (let i = 1; i < poly.length; i++) {
    if (pointInRing(x, y, poly[i])) return false;
  }
  return true;
}

// Bounding boxes computed once per process so most polygons are rejected with
// four comparisons instead of a full ray cast.
const boxCache = new WeakMap();
function boxesFor(feature) {
  let boxes = boxCache.get(feature);
  if (boxes) return boxes;
  boxes = feature.geometry.coordinates.map(poly => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [x, y] of poly[0]) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    return { minX, minY, maxX, maxY, poly };
  });
  boxCache.set(feature, boxes);
  return boxes;
}

/**
 * Borough containing the point, or "" if none.
 * @param {number} lat @param {number} lng @param {string} city
 */
export function findNeighbourhood(lat, lng, city) {
  const set = SETS[city];
  if (!set) return "";
  if (typeof lat !== "number" || typeof lng !== "number") return "";
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "";
  if (lat === 0 && lng === 0) return "";

  for (const feature of set.features) {
    for (const box of boxesFor(feature)) {
      if (lng < box.minX || lng > box.maxX || lat < box.minY || lat > box.maxY) continue;
      if (pointInPolygon(lng, lat, box.poly)) return feature.properties.name;
    }
  }
  return "";
}

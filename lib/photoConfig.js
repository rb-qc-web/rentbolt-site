// Single source of truth for how photos are located in Monday.
// monday.js (reads galleries) and migrate.js (writes them) BOTH import this,
// so the two can never drift apart again — that drift caused several outages:
// "RB Website Photos" vs "RB Website", and `link` vs `link_mkx19xr3`.

/** Accepted names for the photo subitem, normalised. Add variants freely. */
const SUBITEM_ALIASES = [
  "rb website",
  "rb website photos",
  "rb websites",
  "website photos",
  "rb photos",
];

function normalise(s) {
  return String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** True if this subitem is the curated website-photos subitem. */
export function isPhotoSubitem(subitemName) {
  return SUBITEM_ALIASES.includes(normalise(subitemName));
}

/** Find the photo subitem on an item, tolerant of naming variants. */
export function findPhotoSubitem(item) {
  return (item?.subitems || []).find(s => isPhotoSubitem(s.name)) || null;
}

/**
 * Find a Drive URL anywhere in a subitem's columns.
 * Deliberately column-agnostic: boards use `link`, `link_mkx19xr3` and others,
 * and hardcoding the id silently broke migration on whole boards.
 */
export function findDriveUrl(subitem) {
  const cols = subitem?.column_values || [];
  const hit = cols.find(cv => String(cv?.text || "").includes("drive.google"));
  return hit?.text || "";
}

/** Where the finished Cloudflare gallery is stored (present on every board). */
export const GALLERY_COLUMN_ID = "long_text5";

/** Parse a stored gallery value into an array of CDN URLs. */
export function parseGallery(rawText) {
  if (!rawText) return [];
  const t = String(rawText).trim();
  if (!t.startsWith("[")) return [];
  try {
    const arr = JSON.parse(t);
    return Array.isArray(arr)
      ? arr.filter(u => typeof u === "string" && u.includes("imagedelivery.net"))
      : [];
  } catch {
    return [];
  }
}

/** Extract Drive folder id, or individual file ids if links were pasted. */
export function parseDriveTarget(url) {
  const raw = String(url || "");
  const folder = raw.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (folder) return { type: "folder", id: folder[1] };

  // Multiple individual file links pasted into one cell (this happened).
  const fileIds = [];
  const re = /(?:\/d\/|[?&]id=)([a-zA-Z0-9_-]{20,})/g;
  let m;
  while ((m = re.exec(raw)) !== null) fileIds.push(m[1]);
  if (fileIds.length) return { type: "files", ids: [...new Set(fileIds)] };

  return { type: "none" };
}

export const MAX_PHOTOS_PER_BUILDING = 20;

/** Boards scanned for photos. Lives here (not migrate.js) so lightweight
 *  routes can import it without pulling in googleapis. */
export const PHOTO_BOARDS = {
  montreal: { id: "3743206409",  city: "Montreal",           locationColId: "location" },
  ottawa:   { id: "4955235841",  city: "Ottawa",             locationColId: "location" },
  toronto:  { id: "18402583974", city: "Toronto",            locationColId: "location_mm3yrv60" },
  london:   { id: "18401824343", city: "London",             locationColId: "location_mm5eg13x" },
  kwcg:     { id: "5892819868",  city: "Kitchener-Waterloo", locationColId: "location_mm3yr7wf" },
};

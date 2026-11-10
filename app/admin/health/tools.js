import { CITY_NAMES } from "@/lib/cityContent";

// Every diagnostic endpoint, declared rather than hand-coded.
//
// The responses have little in common with each other — a bed-count audit and
// a column dump are different shapes — so the page prints the JSON instead of
// pretending there is one layout that fits them all. What it does add is the
// password, the parameters, and a name for what each one is for, which was
// otherwise living in the README.
//
// `summary` pulls the two or three numbers worth seeing without scrolling. It
// is given the parsed response and may return nothing.

// `empty` is what the dropdown reads before a choice is made, which is also
// what that choice means — "all cities", "summary only".
const cityParam = { name: "city", label: "City", type: "city", empty: "All cities" };

export const TOOLS = [
  {
    id: "data-health",
    path: "/api/data-health",
    title: "Data health",
    blurb:
      "Every building we serve, with what is missing: no photos, no price, no unit types, no description. The first place to look when a listing looks wrong.",
    params: [
      cityParam,
      { name: "names", label: "List the building names", type: "flag" },
    ],
    summary: (d) => [
      ["Buildings", d.total ?? d.totalBuildings],
      ["With issues", d.withIssues ?? d.issues?.length],
      ["Cities", d.cities ? Object.keys(d.cities).length : undefined],
    ],
  },
  {
    id: "photo-status",
    path: "/api/photo-status",
    title: "Photo status",
    blurb: "Which buildings have galleries and which are still on the fallback image.",
    summary: (d) => [
      ["With photos", d.withPhotos ?? d.totals?.withPhotos],
      ["Without", d.withoutPhotos ?? d.totals?.withoutPhotos],
      ["Galleries stored", d.galleries ?? d.totalGalleries],
    ],
  },
  {
    id: "pricing-status",
    path: "/api/pricing-status",
    title: "Pricing status",
    blurb:
      "When the rent feed last landed, how many units it priced, and whether we are serving the last known good snapshot.",
    params: [{ name: "names", label: "List the building names", type: "flag" }],
    summary: (d) => [
      ["Units priced", d.unitsPriced ?? d.units],
      ["Last fetched", d.fetchedAt ? new Date(d.fetchedAt).toLocaleString() : undefined],
      ["Stale", d.stale === undefined ? undefined : d.stale ? "yes" : "no"],
    ],
  },
  {
    id: "debug-beds",
    path: "/api/debug-beds",
    title: "Bed counts",
    blurb:
      "What bedroom count each unit type resolves to. Run this when the bed filter returns the wrong set — it is almost always an unrecognised unit-type label.",
    params: [cityParam],
  },
  {
    id: "debug-columns",
    path: "/api/debug-columns",
    title: "Board columns",
    blurb:
      "The column ids each board actually has, next to the ones the code expects. Column ids are unique per board, so this is what to check first after a board is cloned or a column is recreated.",
    params: [{ name: "full", label: "Full dump", type: "city", empty: "Summary only" }],
  },
  {
    id: "debug-neighbourhoods",
    path: "/api/debug-neighbourhoods",
    title: "Neighbourhoods",
    blurb: "The neighbourhood values on a board, to catch typos and splits before they reach the filters.",
    params: [cityParam],
  },
  {
    id: "debug-boards",
    path: "/api/debug-boards",
    title: "Board reachability",
    blurb:
      "Whether each board answers and how many items it returns. The heavy run includes subitems, which is the real query the site makes — it is slow and costs monday complexity budget, so leave it off unless you are chasing a timeout.",
    params: [{ name: "heavy", label: "Include subitems (slow)", type: "flag" }],
  },
  {
    id: "find-building",
    path: "/api/find-building",
    title: "Find a building",
    blurb:
      "Full column and subitem dump for one building, across the listings boards only. The tool for \"why is this one listing behaving oddly\".",
    params: [{ name: "name", label: "Name contains", type: "text", placeholder: "vittorio", required: true }],
  },
  {
    id: "cache-refresh",
    path: "/api/cache-refresh",
    title: "Clear the cache",
    blurb:
      "Drops the buildings cache so the next page view pulls fresh from monday, and marks the pricing snapshot stale. Use after editing a board when you do not want to wait for the ten-minute cron.",
    danger: true,
    confirm: "Clear the cache? The next few page loads will be slow while monday is refetched.",
  },
];

export const CITIES = CITY_NAMES;

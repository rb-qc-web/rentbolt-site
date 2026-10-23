// Canonical labels for filtering.
//
// Each monday board was built independently, so the same real-world thing is
// worded differently per board: Montreal says "Heating Included" where Ontario
// says "Heat", "Electricity Included" where Ontario says "Hydro". Some boards
// even disagree with themselves on capitalisation ("Laundry room" vs "Laundry
// Room"), which makes two entries in a filter menu out of one amenity.
//
// The search filter requires EVERY pick to be present on a building, so an
// unmerged synonym pair is not a cosmetic problem: picking "Water" and "Hot
// Water Included" together can never match anything, and in "All cities" the
// menu offers both.
//
// This maps the variants onto one label per thing. It is used for the filter
// menus and for matching ONLY — cards and detail pages still show whatever the
// board actually says, so no information is lost in display.

/** Normalises for comparison: case, punctuation and spacing all stop mattering. */
export const labelKey = (s) =>
  String(s ?? "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const SYNONYMS = {
  // ---- inclusions -------------------------------------------------------
  "heat": "Heating",
  "heating": "Heating",
  "heating included": "Heating",
  "water": "Hot water",
  "hot water": "Hot water",
  "hot water included": "Hot water",
  "hydro": "Electricity",
  "electricity": "Electricity",
  "electricity included": "Electricity",
  "internet": "Internet",
  "wifi": "Internet",
  "wi fi": "Internet",
  "wifi included": "Internet",
  "parking": "Parking",
  "parking included": "Parking",
  "parking conditions apply": "Parking",
  "parking for a fee": "Parking",
  "appliances only": "Appliances included",

  // ---- amenities --------------------------------------------------------
  "gym": "Gym",
  "fitness center": "Gym",
  "fitness centre": "Gym",
  // Indoor vs outdoor is a real distinction, but one board only ever says
  // "Pool", so keeping them apart would hide those buildings from both of the
  // more specific picks. The detail page still shows which kind it is.
  "pool": "Pool",
  "indoor pool": "Pool",
  "outdoor pool": "Pool",
  "laundry room": "Laundry room",
  "laundry in building": "Laundry room",
  "co working space": "Coworking space",
  "coworking space": "Coworking space",
  "coworking lounge": "Coworking space",
  "bbq area": "BBQ area",
  "bbq terrace": "BBQ area",
  "movie theatre": "Cinema room",
  "theatre": "Cinema room",
  "cinema room": "Cinema room",
  "rooftop terrace": "Rooftop terrace",
  "rooftop patio": "Rooftop terrace",
  "sundeck rooftop": "Rooftop terrace",
  "bike parking": "Bike storage",
  "bike storage": "Bike storage",
  "ev charging": "EV charging",
  "air conditioning": "Air conditioning",
  "a c": "Air conditioning",
  "ac": "Air conditioning",
  "games lounge": "Games room",
  "game room": "Games room",
  "kids playroom": "Kids playroom",
  "storage lockers": "Storage lockers",
};

/**
 * The label to show and match on. Anything with no synonym entry is returned
 * as the board wrote it, so a new amenity appears in the menu immediately
 * rather than vanishing until someone updates this file.
 */
export function canonLabel(raw) {
  return SYNONYMS[labelKey(raw)] || String(raw ?? "").trim();
}

/** Two labels mean the same thing. */
export const canonKey = (raw) => labelKey(canonLabel(raw));

/** True when a canonical pick is satisfied by any of a building's raw labels. */
export function listHas(list, pick) {
  const want = canonKey(pick);
  return (list || []).some(x => canonKey(x) === want);
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Audits which expected column ids actually exist on each board.
//
// lib/monday.js applies a single COL map — built from MONTREAL column ids — to
// all five boards. Monday generates a unique id per board, so any field in that
// map may silently resolve to nothing elsewhere. That has already caused four
// separate bugs (location, amenities, unitsAvail, appliances). This lists every
// mismatch at once instead of waiting for them to surface one at a time.

const BOARDS = {
  montreal: { id: 3743206409,  city: "Montreal" },
  ottawa:   { id: 4955235841,  city: "Ottawa" },
  toronto:  { id: 18402583974, city: "Toronto" },
  london:   { id: 18401824343, city: "London" },
  kwcg:     { id: 5892819868,  city: "Kitchener-Waterloo" },
};

// Fields the site actually reads, and why they matter to a visitor.
const EXPECTED = {
  status2:                "Status — controls whether a building appears at all",
  location:               "Coordinates — no location means no map pin, no search result",
  text3:                  "Promo — drives the In-Demand tag",
  long_text1:             "Building info — description fallback",
  dropdown_mkvqrg13:      "Neighbourhood",
  dropdown_mkvpnqth:      "Units available — powers the bed filters",
  dropdown_mkvpebxp:      "Amenities",
  dropdown_mkvpddyr:      "Appliances",
  dropdown_mkvpaxpe:      "Pets",
  dropdown_mkvp2xa8:      "Parking",
  dropdown_mkvpjqc3:      "Furnished",
};

export async function GET() {
  const report = {};

  for (const [key, board] of Object.entries(BOARDS)) {
    try {
      const res = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
        body: JSON.stringify({
          query: `{ boards(ids: [${board.id}]) { columns { id title type } } }`,
        }),
        cache: "no-store",
      });
      const json = await res.json();
      if (json.errors) { report[key] = { city: board.city, error: JSON.stringify(json.errors) }; continue; }

      const cols = json?.data?.boards?.[0]?.columns || [];
      const ids = new Set(cols.map(c => c.id));

      const missing = Object.entries(EXPECTED)
        .filter(([id]) => !ids.has(id))
        .map(([id, why]) => ({ id, impact: why }));

      // Offer likely replacements so fixing a mismatch doesn't require digging.
      const candidates = {};
      for (const { id } of missing) {
        const wantedType = id.startsWith("dropdown") ? "dropdown"
          : id.startsWith("location") || id === "location" ? "location"
          : null;
        if (wantedType) {
          candidates[id] = cols
            .filter(c => c.type === wantedType)
            .map(c => ({ id: c.id, title: c.title }));
        }
      }

      report[key] = {
        city: board.city,
        totalColumns: cols.length,
        missingCount: missing.length,
        missing,
        possibleReplacements: Object.keys(candidates).length ? candidates : undefined,
      };
    } catch (err) {
      report[key] = { city: board.city, error: err.message };
    }
  }

  return Response.json({
    note: "COL in lib/monday.js uses Montreal column ids for every board. Anything listed under 'missing' is a field the site silently reads as empty on that board.",
    report,
  });
}

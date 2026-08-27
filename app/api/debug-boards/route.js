// Per-board diagnostic: reports exactly why a board returns 0 buildings.
// Bypasses Redis AND the Next.js data cache.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BOARDS = {
  montreal: { id: 3743206409,  city: "Montreal",           locationColId: "location" },
  ottawa:   { id: 4955235841,  city: "Ottawa",             locationColId: "location" },
  toronto:  { id: 18402583974, city: "Toronto",            locationColId: "location_mm3yrv60" },
  london:   { id: 18401824343, city: "London",             locationColId: "location_mm5eg13x" },
  kwcg:     { id: 5892819868,  city: "Kitchener-Waterloo", locationColId: "location_mm3yr7wf" },
};

const ACTIVE = ["Lease-Up", "Stabilization"];

async function rawQuery(query, variables) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json().catch(() => ({ parseError: true }));
  return { httpStatus: res.status, json };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const heavy = searchParams.get("heavy") === "1"; // include subitems (the real query)

  if (!process.env.MONDAY_API_KEY) {
    return Response.json({ error: "MONDAY_API_KEY not set" }, { status: 500 });
  }

  const subitemsFragment = heavy
    ? `subitems { id name column_values { id text value type } }`
    : ``;

  const report = {};

  for (const [key, board] of Object.entries(BOARDS)) {
    const query = `
      query ($boardId: [ID!]!, $cursor: String) {
        boards(ids: $boardId) {
          items_page(limit: 500, cursor: $cursor) {
            cursor
            items {
              id name
              column_values(ids: ["status2", "${board.locationColId}"]) { id text }
              ${subitemsFragment}
            }
          }
        }
      }
    `;

    const started = Date.now();
    try {
      const { httpStatus, json } = await rawQuery(query, { boardId: [String(board.id)], cursor: null });

      if (json?.errors) {
        report[key] = {
          ok: false,
          httpStatus,
          mondayErrors: json.errors,
          ms: Date.now() - started,
        };
        continue;
      }

      const page  = json?.data?.boards?.[0]?.items_page;
      const items = page?.items || [];

      const active = items.filter(i => {
        const s = i.column_values?.find(cv => cv.id === "status2")?.text || "";
        return ACTIVE.some(a => s.includes(a));
      });
      const withCoords = active.filter(i => {
        const loc = i.column_values?.find(cv => cv.id === board.locationColId)?.text || "";
        return loc.trim().length > 0;
      });

      report[key] = {
        ok: true,
        httpStatus,
        totalItems: items.length,
        activeItems: active.length,
        activeWithCoordinates: withCoords.length,
        activeMissingCoordinates: active.length - withCoords.length,
        hasMorePages: Boolean(page?.cursor),
        ms: Date.now() - started,
        // Name the active buildings with no location — these are live listings
        // that silently never appear on the map or in search results.
        missingCoordinateNames: active
          .filter(i => {
            const loc = i.column_values?.find(cv => cv.id === board.locationColId)?.text || "";
            return loc.trim().length === 0;
          })
          .map(i => i.name),
        sampleActive: active.slice(0, 5).map(i => i.name),
      };
    } catch (err) {
      report[key] = { ok: false, thrown: err.message, ms: Date.now() - started };
    }
  }

  return Response.json({
    mode: heavy ? "heavy (with subitems — matches production query)" : "light (no subitems)",
    note: "Compare light vs heavy. If a board is ok in light but fails in heavy, the subitems query is too expensive for Monday.",
    report,
  });
}

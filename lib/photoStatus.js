import { PHOTO_BOARDS } from "./photoConfig";
import { getGalleries } from "./galleryStore";

// Photo coverage report.
//
// Reads galleries from REDIS, which is where the admin upload page writes.
// The previous version classified coverage from Monday subitems — the old
// Drive-migration store — so it would have reported near-zero coverage while
// the VA was actively uploading.

const ACTIVE = ["Lease-Up", "Stabilization"];

async function mondayCall(query) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

async function fetchActive(board) {
  const items = [];
  let cursor = null;
  let pages = 0;
  do {
    const cursorArg = cursor ? `, cursor: "${cursor}"` : "";
    const data = await mondayCall(`{
      boards(ids: [${board.id}]) {
        items_page(limit: 100${cursorArg}) {
          cursor
          items {
            id name
            column_values(ids: ["status2", "${board.locationColId}"]) { id text }
          }
        }
      }
    }`);
    const page = data?.boards?.[0]?.items_page;
    items.push(...(page?.items || []));
    cursor = page?.cursor || null;
    pages++;
  } while (cursor && pages < 12);

  return items.filter(i => {
    const s = i.column_values?.find(cv => cv.id === "status2")?.text || "";
    return ACTIVE.some(a => s.includes(a));
  });
}

export async function getPhotoStatus() {
  const byCity = {};
  const totals = { active: 0, withPhotos: 0, withoutPhotos: 0 };

  for (const [key, board] of Object.entries(PHOTO_BOARDS)) {
    try {
      const active = await fetchActive(board);
      const galleries = await getGalleries(active.map(i => i.id));

      const done = [];
      const missing = [];
      for (const item of active) {
        const label = item.column_values?.find(cv => cv.id === board.locationColId)?.text;
        const name = label ? label.split(",")[0] : item.name;
        if (galleries[item.id]?.length) done.push({ name, photos: galleries[item.id].length });
        else missing.push(name);
      }

      totals.active += active.length;
      totals.withPhotos += done.length;
      totals.withoutPhotos += missing.length;

      byCity[key] = {
        city: board.city,
        active: active.length,
        withPhotos: done.length,
        coverage: active.length ? `${Math.round((done.length / active.length) * 100)}%` : "n/a",
        stillNeedPhotos: missing,
      };
    } catch (err) {
      byCity[key] = { city: board.city, error: err.message };
    }
  }

  return {
    totals: {
      ...totals,
      coverage: totals.active ? `${Math.round((totals.withPhotos / totals.active) * 100)}%` : "n/a",
    },
    byCity,
  };
}

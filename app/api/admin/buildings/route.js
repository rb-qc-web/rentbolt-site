import { checkAuth, mondayCall } from "../_auth";
import { PHOTO_BOARDS } from "@/lib/migrate";
import { findPhotoSubitem, parseGallery, GALLERY_COLUMN_ID } from "@/lib/photoConfig";
import { getPublicName } from "@/lib/publicName";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const ACTIVE = ["Lease-Up", "Stabilization"];

export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const out = [];
  const boardErrors = [];

  for (const [key, board] of Object.entries(PHOTO_BOARDS)) {
    let items = [];
    try {
      // Request ONLY this board's location column — asking for columns that
      // don't exist on a board can fail the whole query. Subitem columns are
      // narrowed to the gallery field to keep the query cheap enough for the
      // largest board (Montreal), which is where complexity limits bite.
      const data = await mondayCall(`{
        boards(ids: [${board.id}]) {
          items_page(limit: 200) {
            items {
              id name
              column_values(ids: ["status2", "${board.locationColId}"]) { id text }
              subitems { id name column_values(ids: ["${GALLERY_COLUMN_ID}"]) { id text } }
            }
          }
        }
      }`);
      items = data?.boards?.[0]?.items_page?.items || [];
    } catch (err) {
      // Never swallow this. A silent skip here is what made the list empty.
      boardErrors.push({ city: board.city, error: err.message });
      continue;
    }

    for (const item of items) {
      const status = item.column_values?.find(cv => cv.id === "status2")?.text || "";
      if (!ACTIVE.some(s => status.includes(s))) continue;

      const address = item.column_values?.find(cv => cv.id === board.locationColId)?.text || "";
      const sub = findPhotoSubitem(item);
      const gallery = sub
        ? parseGallery(sub.column_values?.find(cv => cv.id === GALLERY_COLUMN_ID)?.text)
        : [];

      out.push({
        id: item.id,
        boardId: board.id,
        city: board.city,
        // Internal tool: the real address helps the VA identify the building.
        label: address ? address.split(",")[0] : item.name,
        publicName: getPublicName({ address, city: board.city }),
        subitemId: sub?.id || null,
        photoCount: gallery.length,
        gallery,
      });
    }
  }

  // Buildings with no photos float to the top — the list is the work queue.
  out.sort((a, b) =>
    a.photoCount - b.photoCount || a.city.localeCompare(b.city) || a.label.localeCompare(b.label)
  );

  return Response.json({
    buildings: out,
    total: out.length,
    boardErrors: boardErrors.length ? boardErrors : undefined,
  });
}

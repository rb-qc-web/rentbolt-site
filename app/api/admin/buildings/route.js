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
  for (const [key, board] of Object.entries(PHOTO_BOARDS)) {
    let items = [];
    try {
      const data = await mondayCall(`{
        boards(ids: [${board.id}]) {
          items_page(limit: 200) {
            items {
              id name
              column_values(ids: ["status2","location","location_mm3yrv60","location_mm5eg13x","location_mm3yr7wf"]) { id text }
              subitems { id name column_values { id text } }
            }
          }
        }
      }`);
      items = data?.boards?.[0]?.items_page?.items || [];
    } catch { continue; }

    for (const item of items) {
      const status = item.column_values?.find(cv => cv.id === "status2")?.text || "";
      if (!ACTIVE.some(s => status.includes(s))) continue;

      const address = item.column_values?.find(cv => cv.id?.startsWith("location") && cv.text)?.text || "";
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

  // Buildings with no photos float to the top — that's the work queue.
  out.sort((a, b) =>
    a.photoCount - b.photoCount || a.city.localeCompare(b.city) || a.label.localeCompare(b.label)
  );
  return Response.json({ buildings: out, total: out.length });
}

import { checkAuth } from "../_auth";
import { saveGallery } from "@/lib/galleryStore";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Writes to Redis, not Monday. Monday subitem boards don't reliably expose the
// column we'd need, and chasing per-board column ids was a recurring source of
// silent failures. Nothing in Monday has to be created or configured for photos
// to work now.
export async function POST(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid JSON body" }, { status: 400 }); }

  const { itemId, urls } = body;
  if (!itemId || !Array.isArray(urls)) {
    return Response.json({ error: "itemId and urls are required" }, { status: 400 });
  }

  try {
    const saved = await saveGallery(itemId, urls);
    return Response.json({ ok: true, saved });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

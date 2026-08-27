import { checkAuth, mondayCall } from "../_auth";
import { GALLERY_COLUMN_ID } from "@/lib/photoConfig";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { itemId, boardId, subitemId, urls } = await request.json();
  if (!itemId || !boardId || !Array.isArray(urls)) {
    return Response.json({ error: "itemId, boardId and urls are required" }, { status: 400 });
  }

  try {
    let targetSubitemId = subitemId;

    // Create the "RB Website" subitem if it doesn't exist yet. This removes
    // the whole "missing subitem" failure class — the VA never has to
    // remember to create one by hand.
    if (!targetSubitemId) {
      const created = await mondayCall(
        `mutation ($parentId: ID!) {
           create_subitem(parent_item_id: $parentId, item_name: "RB Website") { id }
         }`,
        { parentId: String(itemId) }
      );
      targetSubitemId = created?.create_subitem?.id;
      if (!targetSubitemId) throw new Error("Could not create the RB Website subitem");
    }

    // Subitems live on their own board; resolve it rather than assuming.
    const meta = await mondayCall(
      `query ($ids: [ID!]) { items(ids: $ids) { id board { id } } }`,
      { ids: [String(targetSubitemId)] }
    );
    const subBoardId = meta?.items?.[0]?.board?.id;
    if (!subBoardId) throw new Error("Could not resolve the subitem board");

    await mondayCall(
      `mutation ($boardId: ID!, $itemId: ID!, $value: JSON!) {
         change_column_value(board_id: $boardId, item_id: $itemId,
           column_id: "${GALLERY_COLUMN_ID}", value: $value) { id }
       }`,
      { boardId: String(subBoardId), itemId: String(targetSubitemId), value: JSON.stringify(JSON.stringify(urls)) }
    );

    return Response.json({ ok: true, subitemId: targetSubitemId, saved: urls.length });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

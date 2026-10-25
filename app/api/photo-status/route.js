// Internal diagnostic. Behind ADMIN_PASSWORD because these endpoints answer
// questions about the inventory that a competitor would also like answered:
// which buildings exist, what they are really called, where they are, which
// have no photos. The public site needs none of them.
import { getPhotoStatus } from "@/lib/photoStatus";
import { checkAuth } from "../admin/_auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  return Response.json(await getPhotoStatus());
}

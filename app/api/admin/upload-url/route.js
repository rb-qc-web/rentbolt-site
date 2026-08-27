import { checkAuth } from "../_auth";

export const dynamic = "force-dynamic";

// Cloudflare Direct Creator Upload: we mint a one-time upload URL server-side
// (keeping the API token secret) and the browser sends the file straight to
// Cloudflare. This bypasses Vercel's 4.5MB request body limit entirely.
export async function POST(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}` },
      body: new FormData(),
    }
  );
  const data = await res.json();
  if (!data.success) {
    return Response.json({ error: "Cloudflare rejected the upload request", detail: data.errors }, { status: 502 });
  }

  const hash = process.env.CLOUDFLARE_ACCOUNT_HASH || "rI5mNFpREjF__LqjPOcOfQ";
  return Response.json({
    uploadURL: data.result.uploadURL,
    id: data.result.id,
    deliveryURL: `https://imagedelivery.net/${hash}/${data.result.id}/public`,
  });
}

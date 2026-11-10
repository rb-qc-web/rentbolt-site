import { checkAuthLimited } from "../_auth";

export const dynamic = "force-dynamic";

// Minimal auth check with no Monday/Google dependencies. If login fails, this
// isolates whether the problem is the password itself or the data call.
export async function GET(request) {
  const auth = await checkAuthLimited(request);
  if (!auth.ok) {
    // auth.response is set on a 429 and carries Retry-After, which the
    // diagnostics page shows to say how long the lockout lasts.
    if (auth.response) return auth.response;
    return Response.json(
      { ok: false, error: auth.error, adminPasswordConfigured: Boolean(process.env.ADMIN_PASSWORD) },
      { status: auth.status }
    );
  }
  return Response.json({
    ok: true,
    adminPasswordConfigured: true,
    mondayKeyPresent: Boolean(process.env.MONDAY_API_KEY),
    cloudflareConfigured: Boolean(process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN),
  });
}

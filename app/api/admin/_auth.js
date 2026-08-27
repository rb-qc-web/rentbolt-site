// Shared auth for every admin route. The password is checked SERVER-SIDE on
// each request — the UI gate is only cosmetic and must never be trusted.
export function checkAuth(request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return { ok: false, status: 500, error: "ADMIN_PASSWORD not configured" };
  const given = request.headers.get("x-admin-password");
  if (given !== expected) return { ok: false, status: 401, error: "Unauthorized" };
  return { ok: true };
}

export async function mondayCall(query, variables = {}) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: process.env.MONDAY_API_KEY },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

import { checkAuth } from "../admin/_auth";
import { BOARDS } from "@/lib/monday";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Full column and subitem dump for one building — the tool for "why is this
// listing behaving oddly".
//
// This was public, and that was the worst hole on the site. Three things were
// wrong at once:
//
//   1. It returns EVERY column, which at the time included "Apartment Entry" —
//      lockbox codes, intercom codes, and tenants' personal phone numbers and
//      emails. Those are off the listing pages now; they were still served
//      here.
//   2. The board id came from the query string, so it was not a listings
//      endpoint at all: anyone could point it at any board in the monday
//      account — clients, deals, anything — and it would run with the server's
//      own API key, so monday saw an authorised request.
//   3. The id was interpolated straight into the GraphQL string, so a crafted
//      value could restructure the query.
//
// Now: admin password required, and the board must be one we actually serve.
// The allowlist is what kills (2) and (3) — validating the shape of the id
// would still permit any numeric board in the account.

const ALLOWED_BOARDS = Object.fromEntries(
  Object.values(BOARDS).map(b => [String(b.id), b.city])
);

export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.toLowerCase();
  const boardId = searchParams.get("board") || "3743206409";

  if (!name) {
    return Response.json({
      error: "Pass ?name=vittorio",
      boards: ALLOWED_BOARDS,
    }, { status: 400 });
  }

  if (!ALLOWED_BOARDS[boardId]) {
    return Response.json({
      error: "Unknown board. Only the listings boards can be queried.",
      boards: ALLOWED_BOARDS,
    }, { status: 400 });
  }

  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return Response.json({ error: "MONDAY_API_KEY not configured" }, { status: 500 });

  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    // $boardId as a variable rather than string interpolation: even with the
    // allowlist above, a query built by concatenation is a habit worth not
    // having.
    body: JSON.stringify({
      query: `query ($boardId: [ID!]) {
        boards(ids: $boardId) {
          items_page(limit: 500) {
            items {
              id name
              column_values { id text value type }
              subitems {
                id name
                column_values { id text value type }
              }
            }
          }
        }
      }`,
      variables: { boardId: [boardId] },
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (data.errors) {
    return Response.json({ error: "Monday query failed", details: data.errors }, { status: 502 });
  }

  const items = data?.data?.boards?.[0]?.items_page?.items || [];
  const matches = items.filter(i => i.name.toLowerCase().includes(name));
  return Response.json({ board: ALLOWED_BOARDS[boardId], matches, total: items.length });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("name")?.toLowerCase();
  const boardId = searchParams.get("board") || "3743206409";

  if (!name) return Response.json({ error: "Pass ?name=vittorio" });

  const apiKey = process.env.MONDAY_API_KEY;
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query: `{
      boards(ids: [${boardId}]) {
        items_page(limit: 500) {
          items {
            id name
            subitems {
              id name
              column_values { id text value type }
            }
          }
        }
      }
    }` }),
    cache: "no-store",
  });

  const data = await res.json();
  const items = data?.data?.boards?.[0]?.items_page?.items || [];
  const matches = items.filter(i => i.name.toLowerCase().includes(name));
  return Response.json({ matches, total: items.length });
}

export async function GET() {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

  const query = `{
    boards(ids: [18402583974]) {
      items_page(limit: 50) {
        items {
          id name
          subitems {
            id name
            column_values { id title text type }
          }
        }
      }
    }
  }`;

  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query }),
    cache: "no-store",
  });
  const data = await res.json();
  const items = data?.data?.boards?.[0]?.items_page?.items || [];
  // Return first item that has subitems
  const withSubs = items.find(i => i.subitems?.length > 0);
  return Response.json(withSubs || { message: "No items with subitems found", total: items.length });
}

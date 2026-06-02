export async function GET() {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return Response.json({ error: "No API key" }, { status: 500 });

  const call = async (query) => {
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: apiKey },
      body: JSON.stringify({ query }),
      cache: "no-store",
    });
    return res.json();
  };

  // Step 1: get the Towns on Danforth item ID
  const itemsData = await call(`{
    boards(ids: [18402583974]) {
      items_page(limit: 100) {
        items { id name }
      }
    }
  }`);

  const items = itemsData?.data?.boards?.[0]?.items_page?.items || [];
  const target = items.find(i => i.name.toLowerCase().includes("towns") || i.name.toLowerCase().includes("danforth"))
    || items[0];

  if (!target) return Response.json({ error: "No items found", raw: itemsData });

  // Step 2: fetch subitems for that specific item via items query
  const subData = await call(`{
    items(ids: [${target.id}]) {
      id name
      subitems {
        id name
        column_values { id title text value type }
      }
    }
  }`);

  return Response.json({
    parent: target,
    subitemsResult: subData?.data?.items?.[0] || null,
    errors: subData?.errors || null,
  });
}

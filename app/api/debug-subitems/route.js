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

  const subData = await call(`{
    items(ids: [11427147050]) {
      id name
      subitems {
        id name
        column_values { id text value type }
      }
    }
  }`);

  return Response.json(subData?.data?.items?.[0] || { errors: subData?.errors });
}

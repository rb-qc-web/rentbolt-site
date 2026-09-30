import { checkAuth } from "../_auth";
import { listLeads, leadToText, leadsConfigured } from "@/lib/leadStore";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Every lead the site has captured, newest first. Same ADMIN_PASSWORD as the
// photo tool. `?format=csv` gives a file that opens in Excel.
export async function GET(request) {
  const auth = checkAuth(request);
  if (!auth.ok) return Response.json({ error: auth.error }, { status: auth.status });

  if (!leadsConfigured()) {
    return Response.json({ error: "Lead storage is not configured (UPSTASH_REDIS_REST_* missing)." }, { status: 503 });
  }

  const url = new URL(request.url);
  const kind = url.searchParams.get("kind") || "";

  try {
    let { total, leads } = await listLeads(500);
    if (kind) leads = leads.filter(l => l.kind === kind);

    if (url.searchParams.get("format") === "csv") {
      return new Response(toCsv(leads), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="rentbolt-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    return Response.json({ total, shown: leads.length, leads });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function toCsv(leads) {
  const cell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = [["Date", "Type", "Name", "Email", "Phone", "City", "Details"].map(cell).join(",")];
  for (const l of leads) {
    rows.push([
      l.createdAt || "", l.kind || "", l.name || "", l.email || "",
      l.phone || "", l.city || l.building?.city || "", leadToText(l),
    ].map(cell).join(","));
  }
  return rows.join("\n");
}

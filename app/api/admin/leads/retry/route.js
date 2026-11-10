import { checkAuthLimited } from "../../_auth";
import { getLead, listLeads, forwardToMonday, recordDelivery } from "@/lib/leadStore";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Re-send a lead to monday after a failed delivery.
//
// `?all=1` retries every lead currently marked failed, which is the realistic
// case: a monday outage takes out a run of them at once, not one.

export async function POST(request) {
  const auth = await checkAuthLimited(request);
  if (!auth.ok) return auth.response || Response.json({ error: auth.error }, { status: auth.status });

  let body;
  try { body = await request.json(); }
  catch { body = {}; }

  // One lead
  if (body?.id) {
    const lead = await getLead(String(body.id));
    if (!lead) return Response.json({ error: "Lead not found" }, { status: 404 });

    const fwd = await forwardToMonday(lead);
    await recordDelivery(lead.id, fwd);
    return Response.json({
      ok: fwd.forwarded,
      id: lead.id,
      error: fwd.forwarded ? null : fwd.reason,
    });
  }

  // Everything that failed
  if (body?.all) {
    const { leads } = await listLeads(500);
    const failed = leads.filter(l => l.delivery?.state === "failed");

    const results = [];
    for (const lead of failed) {
      const fwd = await forwardToMonday(lead);
      await recordDelivery(lead.id, fwd);
      results.push({ id: lead.id, ok: fwd.forwarded, error: fwd.forwarded ? null : fwd.reason });
      // If monday is still down, stop rather than grinding through all of them
      // and timing out the request.
      if (!fwd.forwarded && results.filter(r => !r.ok).length >= 3) break;
    }

    return Response.json({
      ok: true,
      attempted: results.length,
      delivered: results.filter(r => r.ok).length,
      stillFailing: results.filter(r => !r.ok).length,
      results,
    });
  }

  return Response.json({ error: "Pass an id, or all: true" }, { status: 400 });
}

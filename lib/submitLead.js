// Shared client-side submit for every lead form.
//
// The one rule this enforces: a form may only report success when the server
// actually confirmed it. An unhandled rejection or a non-JSON error page must
// surface as an error, never as a thank-you — a visitor told "an advisor will
// be in touch" when nothing was saved is worse than a visible failure.
//
// res.json() is deliberately not used: a 500 from Next returns an HTML error
// page, and parsing that throws a SyntaxError that would otherwise be reported
// to the visitor as the reason their form failed.

const GENERIC = "We couldn't submit your request right now. Please try again in a moment.";

export async function submitLead(payload, endpoint = "/api/leads") {
  let res;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Network error — please check your connection and try again.");
  }

  const text = await res.text().catch(() => "");
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* HTML error page */ }

  if (!res.ok || !data?.ok) throw new Error(data?.error || GENERIC);
  return data;
}

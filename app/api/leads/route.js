import { saveLead, forwardToMonday, leadsConfigured } from "@/lib/leadStore";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Public lead intake for the three site forms. One endpoint rather than three,
// because the validation, the storage and the Monday forward are identical and
// only the field set differs.
//
// Fields are whitelisted per kind, not copied wholesale from the body: this is
// an unauthenticated endpoint, so anything we accept is something a stranger
// can write into our Redis.

const str = (v, max) => String(v ?? "").trim().slice(0, max);

const strList = (v, maxItems, maxLen) =>
  (Array.isArray(v) ? v : [])
    .map((x) => str(x, maxLen))
    .filter(Boolean)
    .slice(0, maxItems);

const num = (v, lo, hi) => {
  // "" is a blank field, not zero — Number("") would quietly become 0 and show
  // up as a $0 budget in the advisor's inbox.
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  return Math.min(hi, Math.max(lo, Math.round(n)));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function buildRecord(kind, body) {
  const base = {
    kind,
    name: str(body?.name, 120),
    email: str(body?.email, 160).toLowerCase(),
    phone: str(body?.phone, 40),
  };

  if (kind === "tenant") {
    return {
      ...base,
      city: str(body?.city, 60),
      unitTypes: strList(body?.unitTypes, 12, 40),
      budgetMin: num(body?.budgetMin, 0, 100000),
      budgetMax: num(body?.budgetMax, 0, 100000),
      moveInDate: str(body?.moveInDate, 20),
      flexible: Boolean(body?.flexible),
      furnished: str(body?.furnished, 40),
      pets: str(body?.pets, 40),
      petTypes: strList(body?.petTypes, 6, 40),
      mustHaves: strList(body?.mustHaves, 20, 40),
      notes: str(body?.notes, 1500),
    };
  }

  if (kind === "landlord") {
    return {
      ...base,
      company: str(body?.company, 140),
      city: str(body?.city, 60),
      portfolio: str(body?.portfolio, 40),
      message: str(body?.message, 1500),
    };
  }

  // visit
  return {
    ...base,
    visitType: body?.visitType === "virtual" ? "virtual" : "in-person",
    moveIn: str(body?.moveIn, 20),
    message: str(body?.message, 1500),
    building: {
      id: str(body?.building?.id, 40),
      slug: str(body?.building?.slug, 160),
      name: str(body?.building?.name, 160),
      city: str(body?.building?.city, 60),
    },
  };
}

export async function POST(request) {
  let body;
  try { body = await request.json(); }
  catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }

  const kind = str(body?.kind, 20);
  if (!["tenant", "landlord", "visit"].includes(kind)) {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const record = buildRecord(kind, body);

  if (!record.name) {
    return Response.json({ error: "Please enter your name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(record.email)) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (kind === "tenant" && !record.city) {
    return Response.json({ error: "Please choose a city." }, { status: 400 });
  }
  if (kind === "tenant" && record.budgetMin && record.budgetMax && record.budgetMin > record.budgetMax) {
    const lo = record.budgetMax; record.budgetMax = record.budgetMin; record.budgetMin = lo;
  }

  if (!leadsConfigured()) {
    // Better a visible failure than a cheerful lie: the visitor is told to
    // contact us another way rather than being thanked for nothing.
    return Response.json(
      { error: "We couldn't submit your request right now. Please email rent@rentbolt.ca and we'll pick it up." },
      { status: 503 },
    );
  }

  let saved;
  try {
    saved = await saveLead(record);
  } catch {
    return Response.json(
      { error: "We couldn't submit your request right now. Please try again in a moment." },
      { status: 500 },
    );
  }

  // Fire-and-report: the lead is already safe in Redis, so a Monday failure is
  // logged for us and invisible to the visitor.
  const fwd = await forwardToMonday(saved);
  if (!fwd.forwarded && fwd.reason !== "not configured") {
    console.error("[leads] Monday forward failed:", fwd.reason);
  }

  return Response.json({ ok: true });
}

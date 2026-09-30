import { Redis } from "@upstash/redis";

// Every lead the site captures lands here, whatever form produced it. Redis is
// the source of truth because it cannot fail for a reason we don't control: a
// Monday board can be renamed, its columns re-created with new ids, or its API
// can rate-limit, and none of that may cost us a tenant's email address.
//
// Forwarding to Monday is deliberately best-effort and column-agnostic (see
// forwardToMonday below), so a mis-configured board degrades to "the lead is in
// Redis" rather than "the lead is gone".

export const LEADS_INDEX = "rentbolt:leads";
const leadKey = (id) => `rentbolt:lead:${id}`;

export function leadsConfigured() {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

function redis() {
  if (!leadsConfigured()) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Kinds are stored on the record so the admin view can group them and so a
// future Monday sync can route each kind to the right board.
export const LEAD_KINDS = ["tenant", "landlord", "visit", "saved-list"];

export const KIND_LABELS = {
  tenant: "Find a place",
  landlord: "Landlord",
  visit: "Book a visit",
  "saved-list": "Saved list",
};

/** Persists a lead. Throws if Redis is unavailable — callers must surface that. */
export async function saveLead(lead) {
  const r = redis();
  if (!r) throw new Error("Lead storage is not configured");

  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const record = { id, ...lead, createdAt: new Date(now).toISOString() };

  // The record is written before the index entry: an orphaned record is
  // invisible but recoverable, whereas an index entry with no record would make
  // the admin list render a hole.
  await r.set(leadKey(id), JSON.stringify(record));
  await r.zadd(LEADS_INDEX, { score: now, member: id });

  return record;
}

/** Newest first. */
export async function listLeads(limit = 200) {
  const r = redis();
  if (!r) return { total: 0, leads: [] };

  const ids = await r.zrange(LEADS_INDEX, 0, Math.max(0, limit - 1), { rev: true });
  if (!ids?.length) return { total: 0, leads: [] };

  const raw = await r.mget(...ids.map(leadKey));
  const leads = raw
    .map((v) => {
      if (!v) return null;
      if (typeof v !== "string") return v;
      try { return JSON.parse(v); } catch { return null; }
    })
    .filter(Boolean)
    // Records written before kinds existed were all saved lists.
    .map((l) => (l.kind ? l : { ...l, kind: "saved-list" }));

  const total = await r.zcard(LEADS_INDEX).catch(() => leads.length);
  return { total, leads };
}

/**
 * Pushes a lead onto a Monday board, if one is configured.
 *
 * This creates the item with a name only and puts every field into an update
 * (a comment) on that item. That is on purpose: column ids are unique per
 * board on Monday, so any hardcoded mapping here would be one board rename away
 * from silently dropping fields. A human reading the update loses nothing.
 *
 * Never throws — a failed forward must not fail the visitor's submit.
 */
export async function forwardToMonday(record) {
  const boardId = process.env.MONDAY_LEADS_BOARD_ID;
  const apiKey = process.env.MONDAY_API_KEY;
  if (!boardId || !apiKey) return { forwarded: false, reason: "not configured" };

  const title = `${record.name || "Unnamed"} — ${KIND_LABELS[record.kind] || record.kind}`;

  try {
    const created = await mondayCall(apiKey, `
      mutation ($board: ID!, $name: String!) {
        create_item(board_id: $board, item_name: $name) { id }
      }
    `, { board: String(boardId), name: title.slice(0, 250) });

    const itemId = created?.create_item?.id;
    if (!itemId) return { forwarded: false, reason: "no item id returned" };

    await mondayCall(apiKey, `
      mutation ($item: ID!, $body: String!) {
        create_update(item_id: $item, body: $body) { id }
      }
    `, { item: String(itemId), body: leadToText(record) });

    return { forwarded: true, itemId };
  } catch (err) {
    return { forwarded: false, reason: err.message };
  }
}

async function mondayCall(apiKey, query, variables) {
  const res = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data;
}

/** Human-readable dump of a lead, for the Monday update and for CSV export. */
export function leadToText(record) {
  const lines = [];
  const add = (label, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) { if (value.length) lines.push(`${label}: ${value.join(", ")}`); return; }
    if (typeof value === "boolean") { if (value) lines.push(`${label}: yes`); return; }
    const s = String(value).trim();
    if (s) lines.push(`${label}: ${s}`);
  };

  add("Type", KIND_LABELS[record.kind] || record.kind);
  add("Name", record.name);
  add("Email", record.email);
  add("Phone", record.phone);
  add("Company", record.company);
  add("City", record.city);
  add("Portfolio size", record.portfolio);
  add("Unit types", record.unitTypes);
  if (record.budgetMin || record.budgetMax) {
    lines.push(`Budget: $${record.budgetMin || "?"} – $${record.budgetMax || "?"}`);
  }
  add("Move-in", record.flexible ? "Flexible" : (record.moveIn || record.moveInDate));
  add("Furnished", record.furnished);
  add("Pets", record.pets);
  add("Pet types", record.petTypes);
  add("Must-haves", record.mustHaves);
  add("Visit type", record.visitType);
  if (record.building) {
    add("Building", record.building.name);
    if (record.building.slug) add("Listing", `https://rentbolt.ca/buildings/${record.building.slug}`);
  }
  add("Saved buildings", (record.buildings || []).map(b => b?.name || b?.slug || b?.id).filter(Boolean));
  add("Notes", record.notes || record.message || record.note);
  add("Submitted", record.createdAt);

  return lines.join("\n");
}

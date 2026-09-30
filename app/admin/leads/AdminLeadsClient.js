"use client";

import { useEffect, useMemo, useState } from "react";

const NAVY = "#0A1F5C";

const KIND_LABELS = {
  tenant: "Find a place",
  landlord: "Landlord",
  visit: "Book a visit",
  "saved-list": "Saved list",
};

const KIND_COLORS = {
  tenant: { bg: "#EEF2FF", fg: "#3730A3" },
  landlord: { bg: "#ECFDF5", fg: "#065F46" },
  visit: { bg: "#FFF7ED", fg: "#9A3412" },
  "saved-list": { bg: "#FDF2F8", fg: "#9D174D" },
};

// Shares sessionStorage with the photo tool so signing in once covers both.
const PW_KEY = "rb_admin_pw";

export default function AdminLeadsClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [kind, setKind] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  async function load(pwOverride) {
    const password = pwOverride ?? pw;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/leads", { headers: { "x-admin-password": password } });

      if (res.status === 401) {
        setAuthError("Wrong password");
        setAuthed(false);
        sessionStorage.removeItem(PW_KEY);
        return false;
      }

      // Text first: a 500 returns an HTML page, and res.json() on that throws
      // a SyntaxError that would otherwise read as "wrong password".
      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); }
      catch {
        setAuthError(`Server error (${res.status}). ${raw.slice(0, 120)}`);
        setAuthed(false);
        return false;
      }

      if (!res.ok) {
        setAuthError(data.error || `Server error (${res.status})`);
        setAuthed(false);
        return false;
      }

      setLeads(data.leads || []);
      setTotal(data.total || 0);
      setAuthed(true);
      setAuthError("");
      return true;
    } catch (err) {
      setAuthError(`Network error: ${err.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) { setPw(saved); load(saved); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    const ok = await load(pw);
    if (ok) sessionStorage.setItem(PW_KEY, pw);
  }

  function downloadCsv() {
    // The CSV route needs the password header, so it can't be a plain link.
    fetch("/api/admin/leads?format=csv", { headers: { "x-admin-password": pw } })
      .then(r => r.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `rentbolt-leads-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => {});
  }

  const counts = useMemo(() => {
    const c = {};
    for (const l of leads) c[l.kind] = (c[l.kind] || 0) + 1;
    return c;
  }, [leads]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(l => {
      if (kind && l.kind !== kind) return false;
      if (!q) return true;
      const hay = [l.name, l.email, l.phone, l.company, l.city, l.building?.name]
        .filter(Boolean).join(" ").toLowerCase();
      return hay.includes(q);
    });
  }, [leads, kind, query]);

  if (!authed) {
    return (
      <div style={{ minHeight: "100dvh", display: "grid", placeItems: "center", background: "#F7F8FA", fontFamily: "system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "#fff", padding: 32, borderRadius: 16, width: 340, boxShadow: "0 4px 24px rgba(10,31,92,0.08)" }}>
          <h1 style={{ margin: "0 0 4px", fontSize: 20, color: NAVY }}>RentBolt Admin</h1>
          <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8B92A5" }}>Leads</p>
          <input
            type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Password" autoFocus
            style={{ width: "100%", padding: "12px 14px", border: "1px solid #E8EBF0", borderRadius: 10, fontSize: 14, marginBottom: 12, boxSizing: "border-box" }}
          />
          {authError && <p style={{ color: "#C0392B", fontSize: 13, margin: "0 0 12px" }}>{authError}</p>}
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 12, background: NAVY, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", background: "#F7F8FA", fontFamily: "system-ui, sans-serif", padding: "28px 20px 64px" }}>
      <div style={{ maxWidth: 980, margin: "0 auto" }}>

        <header style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: 24, color: NAVY, letterSpacing: "-0.02em" }}>Leads</h1>
            <p style={{ margin: 0, fontSize: 13, color: "#8B92A5" }}>
              {total} total{visible.length !== leads.length ? ` · ${visible.length} shown` : ""}
              {" · "}<a href="/admin/photos" style={{ color: NAVY }}>Photo upload</a>
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => load()} disabled={loading} style={btn(false)}>
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button onClick={downloadCsv} style={btn(true)}>Export CSV</button>
          </div>
        </header>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          <Chip label={`All (${leads.length})`} active={!kind} onClick={() => setKind("")} />
          {Object.keys(KIND_LABELS).map(k => (
            counts[k] ? (
              <Chip key={k} label={`${KIND_LABELS[k]} (${counts[k]})`} active={kind === k} onClick={() => setKind(kind === k ? "" : k)} />
            ) : null
          ))}
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Search name, email, city…"
            style={{
              marginLeft: "auto", padding: "9px 13px", border: "1px solid #E8EBF0",
              borderRadius: 999, fontSize: 13, width: 240, background: "#fff", boxSizing: "border-box",
            }}
          />
        </div>

        {visible.length === 0 ? (
          <div style={{ background: "#fff", borderRadius: 14, padding: "48px 24px", textAlign: "center", color: "#8B92A5", fontSize: 14 }}>
            {leads.length === 0
              ? "No leads yet. Submissions from the site forms will appear here."
              : "No leads match this filter."}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {visible.map(l => {
              const c = KIND_COLORS[l.kind] || { bg: "#F1F5F9", fg: "#334155" };
              const isOpen = openId === l.id;
              return (
                <div key={l.id || l.createdAt} style={{ background: "#fff", borderRadius: 14, boxShadow: "0 1px 3px rgba(10,31,92,0.06)", overflow: "hidden" }}>
                  <button
                    onClick={() => setOpenId(isOpen ? null : l.id)}
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                      background: "none", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                    }}
                  >
                    <span style={{
                      flexShrink: 0, padding: "4px 10px", borderRadius: 999, fontSize: 11,
                      fontWeight: 700, background: c.bg, color: c.fg, whiteSpace: "nowrap",
                    }}>
                      {KIND_LABELS[l.kind] || l.kind}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 14, color: NAVY, flexShrink: 0 }}>{l.name || "—"}</span>
                    <span style={{ fontSize: 13, color: "#5A6278", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {l.email}
                    </span>
                    <span style={{ marginLeft: "auto", fontSize: 12, color: "#8B92A5", flexShrink: 0, whiteSpace: "nowrap" }}>
                      {fmtDate(l.createdAt)}
                    </span>
                    <span style={{ color: "#C5CBE0", flexShrink: 0, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
                  </button>

                  {isOpen && (
                    <div style={{ padding: "4px 18px 18px", borderTop: "1px solid #F1F3F7" }}>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "14px 0" }}>
                        <a href={`mailto:${l.email}`} style={btn(true)}>Email</a>
                        {l.phone && <a href={`tel:${l.phone}`} style={btn(false)}>Call {l.phone}</a>}
                        {l.building?.slug && (
                          <a href={`/buildings/${l.building.slug}`} target="_blank" rel="noreferrer" style={btn(false)}>
                            View listing
                          </a>
                        )}
                      </div>
                      <Details lead={l} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Details({ lead }) {
  const rows = [];
  const add = (label, value) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) { if (value.length) rows.push([label, value.join(", ")]); return; }
    if (typeof value === "boolean") { if (value) rows.push([label, "Yes"]); return; }
    const s = String(value).trim();
    if (s) rows.push([label, s]);
  };

  add("Phone", lead.phone);
  add("Company", lead.company);
  add("City", lead.city || lead.building?.city);
  add("Portfolio", lead.portfolio);
  add("Unit types", lead.unitTypes);
  if (lead.budgetMin || lead.budgetMax) {
    rows.push(["Budget", `$${lead.budgetMin ?? "?"} – $${lead.budgetMax ?? "?"}`]);
  }
  add("Move-in", lead.flexible ? "Flexible" : (lead.moveIn || lead.moveInDate));
  add("Furnished", lead.furnished);
  add("Pets", lead.pets);
  add("Pet types", lead.petTypes);
  add("Must-haves", lead.mustHaves);
  add("Visit type", lead.visitType);
  add("Building", lead.building?.name);
  add("Notes", lead.notes || lead.message || lead.note);

  const buildings = lead.buildings || [];

  return (
    <>
      {rows.length > 0 && (
        <dl style={{ display: "grid", gridTemplateColumns: "130px 1fr", gap: "8px 16px", margin: 0, fontSize: 13 }}>
          {rows.map(([k, v]) => (
            <div key={k} style={{ display: "contents" }}>
              <dt style={{ color: "#8B92A5", fontWeight: 600 }}>{k}</dt>
              <dd style={{ margin: 0, color: "#2A3348", whiteSpace: "pre-wrap" }}>{v}</dd>
            </div>
          ))}
        </dl>
      )}

      {buildings.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#8B92A5", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Saved homes ({buildings.length})
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#2A3348", lineHeight: 1.7 }}>
            {buildings.map((b, i) => (
              <li key={b.id || i}>
                {b.name || b.id}
                {b.neighbourhood ? ` — ${b.neighbourhood}` : ""}
                {b.price ? ` — from $${b.price}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function Chip({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: "7px 14px", borderRadius: 999, fontSize: 12.5, fontWeight: 700, cursor: "pointer",
      fontFamily: "inherit", border: `1px solid ${active ? NAVY : "#E8EBF0"}`,
      background: active ? NAVY : "#fff", color: active ? "#fff" : "#5A6278",
    }}>{label}</button>
  );
}

function btn(primary) {
  return {
    padding: "9px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit", textDecoration: "none",
    border: primary ? "none" : "1px solid #E8EBF0",
    background: primary ? NAVY : "#fff",
    color: primary ? "#fff" : "#5A6278",
    display: "inline-block",
  };
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

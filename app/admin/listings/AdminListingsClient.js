"use client";

import { useEffect, useMemo, useState } from "react";

const NAVY = "#0A1F5C";
const PW_KEY = "rb_admin_pw";

export default function AdminListingsClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [loading, setLoading] = useState(false);

  const [buildings, setBuildings] = useState([]);
  const [query, setQuery] = useState("");
  const [onlyIssues, setOnlyIssues] = useState(false);
  const [saving, setSaving] = useState({});

  async function load(password) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/visibility", { headers: { "x-admin-password": password } });
      if (res.status === 401) {
        setAuthError("Wrong password");
        setAuthed(false);
        sessionStorage.removeItem(PW_KEY);
        return false;
      }
      if (res.status === 429) {
        setAuthError("Too many wrong attempts from this address. Try again in fifteen minutes.");
        setAuthed(false);
        return false;
      }
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
      setBuildings(data.buildings || []);
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
    if (await load(pw)) sessionStorage.setItem(PW_KEY, pw);
  }

  async function toggle(b) {
    const next = !b.hidden;
    setSaving(s => ({ ...s, [b.slug]: true }));
    // Optimistic: the toggle should feel instant, and a failure puts it back.
    setBuildings(list => list.map(x => (x.slug === b.slug ? { ...x, hidden: next } : x)));
    try {
      const res = await fetch("/api/admin/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": pw },
        body: JSON.stringify({ slug: b.slug, hidden: next }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
    } catch {
      setBuildings(list => list.map(x => (x.slug === b.slug ? { ...x, hidden: !next } : x)));
      setAuthError(`Could not change "${b.name}". Try again.`);
    } finally {
      setSaving(s => ({ ...s, [b.slug]: false }));
    }
  }

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return buildings.filter(b => {
      if (onlyIssues && !(b.noUnits || b.noPrice)) return false;
      if (!q) return true;
      return `${b.name} ${b.city}`.toLowerCase().includes(q);
    });
  }, [buildings, query, onlyIssues]);

  const hiddenCount = buildings.filter(b => b.hidden).length;
  const issueCount = buildings.filter(b => !b.hidden && (b.noUnits || b.noPrice)).length;

  if (!authed) {
    return (
      <main style={S.gate}>
        <form onSubmit={handleLogin} style={S.gateCard}>
          <div style={S.gateTitle}>Listings</div>
          <p style={S.gateBlurb}>Choose what appears on the public site.</p>
          <input type="password" value={pw} onChange={e => setPw(e.target.value)}
            placeholder="Admin password" autoFocus style={S.input} />
          <button type="submit" disabled={loading || !pw} style={S.primary}>
            {loading ? "Checking…" : "Sign in"}
          </button>
          {authError && <div style={S.err}>{authError}</div>}
        </form>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <header style={S.head}>
        <div>
          <h1 style={S.h1}>Listings</h1>
          <p style={S.sub}>
            {buildings.length - hiddenCount} on the site · {hiddenCount} hidden
          </p>
        </div>
        <a href="/admin" style={S.link}>← All tools</a>
      </header>

      <p style={S.note}>
        Hiding takes a building off the site immediately — search, city pages, the map and its
        own page. Nothing is deleted: it stays in Monday, and unhiding puts it straight back.
      </p>

      {issueCount > 0 && (
        <div style={S.warn}>
          <strong>{issueCount} listing{issueCount === 1 ? " is" : "s are"} live with no units or no price.</strong>{" "}
          Renters can see {issueCount === 1 ? "it" : "them"} but cannot filter by bedrooms or budget, so
          {issueCount === 1 ? " it" : " they"} will mostly be found by accident.
          <button type="button" onClick={() => setOnlyIssues(true)} style={{ ...S.ghost, marginLeft: 10 }}>
            Show me
          </button>
        </div>
      )}

      {authError && <div style={S.err}>{authError}</div>}

      <div style={S.controls}>
        <label style={S.checkLabel}>
          <input type="checkbox" checked={onlyIssues} onChange={e => setOnlyIssues(e.target.checked)} />
          Only listings missing data
        </label>
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search name or city…" style={S.search} />
      </div>

      <div style={S.list}>
        {visible.length === 0 && <div style={S.empty}>Nothing matches.</div>}
        {visible.map(b => (
          <div key={b.slug} style={{ ...S.row, opacity: b.hidden ? 0.6 : 1 }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={S.rowName}>{b.name}</div>
              <div style={S.rowMeta}>
                {b.city}
                {b.noUnits && <span style={S.tag}>no units</span>}
                {b.noPrice && <span style={S.tag}>no price</span>}
                {b.hidden && <span style={{ ...S.tag, background: "#F1F5F9", color: "#475569" }}>hidden</span>}
              </div>
            </div>
            {!b.hidden && (
              <a href={`/buildings/${b.slug}`} target="_blank" rel="noreferrer" style={S.link}>View</a>
            )}
            <button
              type="button"
              onClick={() => toggle(b)}
              disabled={saving[b.slug]}
              style={b.hidden ? S.showBtn : S.hideBtn}
            >
              {saving[b.slug] ? "…" : b.hidden ? "Put back" : "Hide"}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}

const S = {
  gate: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#F8FAFC", padding: 24 },
  gateCard: {
    width: "100%", maxWidth: 380, background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 14, padding: 28, display: "grid", gap: 12, boxShadow: "0 1px 3px rgba(10,31,92,.06)",
  },
  gateTitle: { fontSize: 20, fontWeight: 700, color: NAVY },
  gateBlurb: { margin: 0, fontSize: 13, lineHeight: 1.5, color: "#64748B" },

  page: { maxWidth: 820, margin: "0 auto", padding: "40px 24px 80px" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 16 },
  h1: { margin: 0, fontSize: 28, fontWeight: 700, color: NAVY },
  sub: { margin: "6px 0 0", fontSize: 14, color: "#64748B" },
  note: { margin: "0 0 18px", fontSize: 13, lineHeight: 1.6, color: "#64748B", maxWidth: 620 },

  warn: {
    background: "#FFFBEB", border: "1px solid #FDE68A", color: "#92400E",
    borderRadius: 11, padding: "13px 16px", marginBottom: 16, fontSize: 14, lineHeight: 1.55,
  },

  controls: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 },
  checkLabel: { display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569", minHeight: 38 },
  search: {
    marginLeft: "auto", minHeight: 38, padding: "0 13px", border: "1px solid #E8EBF0",
    borderRadius: 999, fontSize: 13, width: 240, boxSizing: "border-box",
  },

  list: { display: "flex", flexDirection: "column", gap: 8 },
  empty: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: "40px 20px", textAlign: "center", color: "#94A3B8", fontSize: 14 },
  row: {
    display: "flex", alignItems: "center", gap: 12, background: "#fff",
    border: "1px solid #E2E8F0", borderRadius: 11, padding: "12px 16px",
  },
  rowName: { fontSize: 14, fontWeight: 650, color: NAVY, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  rowMeta: { fontSize: 12, color: "#8B92A5", marginTop: 3, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" },
  tag: { background: "#FFFBEB", color: "#92400E", borderRadius: 999, padding: "2px 8px", fontSize: 11, fontWeight: 650 },

  link: { color: NAVY, fontSize: 13, fontWeight: 600, textDecoration: "none", flexShrink: 0, minHeight: 36, display: "flex", alignItems: "center" },
  hideBtn: { minHeight: 36, padding: "0 14px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  showBtn: { minHeight: 36, padding: "0 14px", border: `1px solid ${NAVY}`, borderRadius: 8, background: NAVY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  ghost: { minHeight: 32, padding: "0 10px", border: "1px solid #FDE68A", borderRadius: 7, background: "#fff", color: "#92400E", fontSize: 12, fontWeight: 600, cursor: "pointer" },

  input: { minHeight: 42, padding: "0 12px", border: "1px solid #CBD5E1", borderRadius: 9, fontSize: 15 },
  primary: { minHeight: 42, border: 0, borderRadius: 9, background: NAVY, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  err: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginBottom: 14 },
};

"use client";

import { useEffect, useState } from "react";
import { TOOLS, CITIES } from "./tools";

const NAVY = "#0A1F5C";

// Same key as the photo and leads tools, so signing in to any one of the three
// covers the others for the session.
const PW_KEY = "rb_admin_pw";

export default function AdminHealthClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);

  // Per-tool parameter values and results, keyed by tool id.
  const [params, setParams] = useState({});
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState({});
  const [open, setOpen] = useState(null);

  // /api/admin/ping exists to answer exactly this question — is the password
  // right — without pulling a payload we are not going to show.
  async function verify(password) {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/ping", { headers: { "x-admin-password": password } });
      if (res.ok) {
        setAuthed(true);
        setAuthError("");
        return true;
      }
      if (res.status === 429) {
        setAuthError("Too many wrong attempts from this address. Try again in fifteen minutes.");
      } else if (res.status === 401) {
        setAuthError("Wrong password");
      } else {
        const raw = await res.text();
        // The likeliest 500 here is no ADMIN_PASSWORD in the environment at
        // all, which looks identical to a wrong password unless we say so.
        setAuthError(
          raw.includes("ADMIN_PASSWORD not configured")
            ? "No admin password is set on this deployment. Add ADMIN_PASSWORD in the Vercel project settings and redeploy."
            : `Server error (${res.status}). ${raw.slice(0, 120)}`,
        );
      }
      setAuthed(false);
      sessionStorage.removeItem(PW_KEY);
      return false;
    } catch (err) {
      setAuthError(`Network error: ${err.message}`);
      return false;
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    const saved = sessionStorage.getItem(PW_KEY);
    if (saved) {
      setPw(saved);
      verify(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    if (await verify(pw)) sessionStorage.setItem(PW_KEY, pw);
  }

  function setParam(toolId, name, value) {
    setParams((p) => ({ ...p, [toolId]: { ...(p[toolId] || {}), [name]: value } }));
  }

  async function run(tool) {
    if (tool.confirm && !window.confirm(tool.confirm)) return;

    const vals = params[tool.id] || {};
    const missing = (tool.params || []).find((p) => p.required && !vals[p.name]);
    if (missing) {
      setResults((r) => ({ ...r, [tool.id]: { error: `${missing.label} is required.` } }));
      setOpen(tool.id);
      return;
    }

    const qs = new URLSearchParams();
    for (const p of tool.params || []) {
      const v = vals[p.name];
      if (v === true) qs.set(p.name, "1");
      else if (v) qs.set(p.name, v);
    }
    const url = qs.toString() ? `${tool.path}?${qs}` : tool.path;

    setBusy((b) => ({ ...b, [tool.id]: true }));
    setOpen(tool.id);
    const startedAt = Date.now();
    try {
      const res = await fetch(url, { headers: { "x-admin-password": pw } });
      // Text first: a 500 is an HTML page, and res.json() on that throws a
      // SyntaxError that reads to the eye like a data problem.
      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch {
        data = { error: `Non-JSON response (${res.status})`, body: raw.slice(0, 400) };
      }
      if (res.status === 401) {
        setAuthed(false);
        setAuthError("Session expired. Sign in again.");
        sessionStorage.removeItem(PW_KEY);
        return;
      }
      setResults((r) => ({
        ...r,
        [tool.id]: { status: res.status, ms: Date.now() - startedAt, url, data },
      }));
    } catch (err) {
      setResults((r) => ({ ...r, [tool.id]: { error: `Network error: ${err.message}`, url } }));
    } finally {
      setBusy((b) => ({ ...b, [tool.id]: false }));
    }
  }

  if (!authed) {
    return (
      <main style={S.gate}>
        <form onSubmit={handleLogin} style={S.gateCard}>
          <div style={S.gateTitle}>Diagnostics</div>
          <p style={S.gateBlurb}>
            These tools read straight from monday and the cache, so they are behind the
            admin password.
          </p>
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Admin password"
            autoFocus
            style={S.input}
          />
          <button type="submit" disabled={checking || !pw} style={S.primary}>
            {checking ? "Checking…" : "Sign in"}
          </button>
          {authError && <div style={S.err}>{authError}</div>}
          <div style={S.gateLinks}>
            <a href="/admin/leads" style={S.link}>Leads</a>
            <span style={{ color: "#CBD5E1" }}>·</span>
            <a href="/admin/photos" style={S.link}>Photos</a>
          </div>
        </form>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <header style={S.head}>
        <div>
          <h1 style={S.h1}>Diagnostics</h1>
          <p style={S.sub}>{TOOLS.length} tools. Signed in for this browser session.</p>
        </div>
        <nav style={S.nav}>
          <a href="/admin/leads" style={S.link}>Leads</a>
          <a href="/admin/photos" style={S.link}>Photos</a>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem(PW_KEY);
              setAuthed(false);
              setPw("");
              setResults({});
            }}
            style={S.ghost}
          >
            Sign out
          </button>
        </nav>
      </header>

      <div style={S.list}>
        {TOOLS.map((tool) => {
          const res = results[tool.id];
          const isOpen = open === tool.id;
          const vals = params[tool.id] || {};
          return (
            <section key={tool.id} style={S.card}>
              <div style={S.cardHead}>
                <div style={{ minWidth: 0 }}>
                  <div style={S.cardTitle}>{tool.title}</div>
                  <p style={S.cardBlurb}>{tool.blurb}</p>
                </div>
                <button
                  type="button"
                  onClick={() => run(tool)}
                  disabled={busy[tool.id]}
                  style={tool.danger ? S.dangerBtn : S.runBtn}
                >
                  {busy[tool.id] ? "Running…" : tool.danger ? "Clear" : "Run"}
                </button>
              </div>

              {!!(tool.params || []).length && (
                <div style={S.paramRow}>
                  {tool.params.map((p) => {
                    if (p.type === "flag") {
                      return (
                        <label key={p.name} style={S.checkLabel}>
                          <input
                            type="checkbox"
                            checked={!!vals[p.name]}
                            onChange={(e) => setParam(tool.id, p.name, e.target.checked)}
                          />
                          {p.label}
                        </label>
                      );
                    }
                    if (p.type === "city") {
                      return (
                        <select
                          key={p.name}
                          value={vals[p.name] || ""}
                          onChange={(e) => setParam(tool.id, p.name, e.target.value)}
                          style={S.select}
                        >
                          <option value="">{p.empty || `${p.label} — all`}</option>
                          {CITIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      );
                    }
                    return (
                      <input
                        key={p.name}
                        value={vals[p.name] || ""}
                        onChange={(e) => setParam(tool.id, p.name, e.target.value)}
                        placeholder={p.placeholder || p.label}
                        style={S.smallInput}
                      />
                    );
                  })}
                </div>
              )}

              {res && isOpen && <Result tool={tool} res={res} onClose={() => setOpen(null)} />}
              {res && !isOpen && (
                <button type="button" onClick={() => setOpen(tool.id)} style={S.reopen}>
                  Show last result{res.status ? ` (${res.status})` : ""}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}

function Result({ tool, res, onClose }) {
  const [copied, setCopied] = useState(false);
  if (res.error) return <div style={S.err}>{res.error}</div>;

  const bad = res.status >= 400;
  const cards = (tool.summary?.(res.data) || []).filter(([, v]) => v !== undefined && v !== null);
  const json = JSON.stringify(res.data, null, 2);

  return (
    <div style={S.result}>
      <div style={S.resultHead}>
        <span style={{ ...S.pill, background: bad ? "#FEF2F2" : "#ECFDF5", color: bad ? "#991B1B" : "#065F46" }}>
          {res.status} · {res.ms}ms
        </span>
        <code style={S.url}>{res.url}</code>
        <span style={{ flex: 1 }} />
        <button
          type="button"
          style={S.ghost}
          onClick={() => {
            navigator.clipboard?.writeText(json);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy JSON"}
        </button>
        <button type="button" style={S.ghost} onClick={onClose}>Hide</button>
      </div>

      {!!cards.length && (
        <div style={S.statRow}>
          {cards.map(([label, value]) => (
            <div key={label} style={S.stat}>
              <div style={S.statValue}>{String(value)}</div>
              <div style={S.statLabel}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <pre style={S.pre}>{json}</pre>
    </div>
  );
}

const S = {
  gate: { minHeight: "100vh", display: "grid", placeItems: "center", background: "#F8FAFC", padding: 24 },
  gateCard: {
    width: "100%", maxWidth: 380, background: "#fff", border: "1px solid #E2E8F0",
    borderRadius: 14, padding: 28, display: "grid", gap: 12,
    boxShadow: "0 1px 3px rgba(10,31,92,.06)",
  },
  gateTitle: { fontSize: 20, fontWeight: 700, color: NAVY },
  gateBlurb: { margin: 0, fontSize: 13, lineHeight: 1.5, color: "#64748B" },
  gateLinks: { display: "flex", gap: 10, justifyContent: "center", fontSize: 13, paddingTop: 4 },

  page: { maxWidth: 940, margin: "0 auto", padding: "40px 24px 80px" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 28 },
  h1: { margin: 0, fontSize: 28, fontWeight: 700, color: NAVY },
  sub: { margin: "6px 0 0", fontSize: 14, color: "#64748B" },
  nav: { display: "flex", alignItems: "center", gap: 12 },

  list: { display: "grid", gap: 14 },
  card: { background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 18 },
  cardHead: { display: "flex", gap: 16, alignItems: "flex-start", justifyContent: "space-between" },
  cardTitle: { fontSize: 16, fontWeight: 650, color: NAVY },
  cardBlurb: { margin: "4px 0 0", fontSize: 13, lineHeight: 1.55, color: "#64748B", maxWidth: 660 },

  paramRow: { display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 14 },
  checkLabel: { display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "#475569", minHeight: 36 },
  select: { minHeight: 36, padding: "0 10px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, background: "#fff", color: "#0F172A" },
  smallInput: { minHeight: 36, padding: "0 10px", border: "1px solid #CBD5E1", borderRadius: 8, fontSize: 13, minWidth: 180 },

  input: { minHeight: 42, padding: "0 12px", border: "1px solid #CBD5E1", borderRadius: 9, fontSize: 15 },
  primary: { minHeight: 42, border: 0, borderRadius: 9, background: NAVY, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  runBtn: { minHeight: 36, padding: "0 16px", border: `1px solid ${NAVY}`, borderRadius: 8, background: NAVY, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  dangerBtn: { minHeight: 36, padding: "0 16px", border: "1px solid #DC2626", borderRadius: 8, background: "#fff", color: "#DC2626", fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0 },
  ghost: { minHeight: 36, padding: "0 12px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, cursor: "pointer" },
  reopen: { marginTop: 12, minHeight: 36, padding: "0 12px", border: "1px dashed #CBD5E1", borderRadius: 8, background: "#fff", color: "#64748B", fontSize: 13, cursor: "pointer" },
  link: { color: NAVY, fontSize: 13, textDecoration: "none", fontWeight: 600 },

  result: { marginTop: 16, borderTop: "1px solid #F1F5F9", paddingTop: 14 },
  resultHead: { display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 },
  pill: { fontSize: 12, fontWeight: 650, padding: "4px 9px", borderRadius: 999 },
  url: { fontSize: 12, color: "#64748B", background: "#F8FAFC", padding: "3px 7px", borderRadius: 5, wordBreak: "break-all" },

  statRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 12 },
  stat: { background: "#F8FAFC", border: "1px solid #EEF2F7", borderRadius: 9, padding: "10px 14px", minWidth: 110 },
  statValue: { fontSize: 20, fontWeight: 700, color: NAVY, lineHeight: 1.1 },
  statLabel: { fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em", marginTop: 3 },

  pre: {
    margin: 0, maxHeight: 420, overflow: "auto", background: "#0F172A", color: "#E2E8F0",
    padding: 14, borderRadius: 9, fontSize: 12, lineHeight: 1.5,
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
  },
  err: { marginTop: 12, background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 13 },
};

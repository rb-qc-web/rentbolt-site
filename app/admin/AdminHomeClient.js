"use client";

import { useEffect, useState } from "react";

const NAVY = "#0A1F5C";
const PW_KEY = "rb_admin_pw";

const TOOLS = [
  {
    href: "/admin/leads",
    title: "Leads",
    blurb: "Everyone who has filled in a form, newest first. Export to CSV, and re-send anything that did not reach Monday.",
  },
  {
    href: "/admin/photos",
    title: "Photos",
    blurb: "Upload and reorder building galleries. Anything without photos falls back to a city image.",
  },
  {
    href: "/admin/listings",
    title: "Listings",
    blurb: "Take a building off the site without deleting anything in Monday. For listings that are not ready to be seen.",
  },
  {
    href: "/admin/health",
    title: "Diagnostics",
    blurb: "Data health, board columns, bed counts, pricing. Where to look when something on the site is wrong.",
  },
];

export default function AdminHomeClient() {
  const [pw, setPw] = useState("");
  const [authed, setAuthed] = useState(false);
  const [authError, setAuthError] = useState("");
  const [checking, setChecking] = useState(false);
  const [stats, setStats] = useState(null);

  async function verify(password) {
    setChecking(true);
    try {
      const res = await fetch("/api/admin/ping", { headers: { "x-admin-password": password } });
      if (res.ok) {
        setAuthed(true);
        setAuthError("");
        loadStats(password);
        return true;
      }
      if (res.status === 429) {
        setAuthError("Too many wrong attempts from this address. Try again in fifteen minutes.");
      } else if (res.status === 401) {
        setAuthError("Wrong password");
      } else {
        const raw = await res.text();
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

  // Each panel is loaded independently and allowed to fail on its own: one slow
  // or broken endpoint should not leave the whole page showing nothing.
  async function loadStats(password) {
    const headers = { "x-admin-password": password };
    const get = async (url) => {
      try {
        const r = await fetch(url, { headers });
        return r.ok ? await r.json() : null;
      } catch {
        return null;
      }
    };

    const [leads, visibility] = await Promise.all([
      get("/api/admin/leads"),
      get("/api/admin/visibility"),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    setStats({
      leadsTotal: leads?.total,
      leadsToday: leads?.leads?.filter(l => (l.createdAt || "").startsWith(today)).length,
      undelivered: leads?.undelivered,
      listings: visibility ? visibility.total - visibility.hidden : undefined,
      hidden: visibility?.hidden,
      needsAttention: visibility?.buildings?.filter(b => !b.hidden && (b.noUnits || b.noPrice)).length,
    });
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

  if (!authed) {
    return (
      <main style={S.gate}>
        <form onSubmit={handleLogin} style={S.gateCard}>
          <div style={S.gateTitle}>RentBolt admin</div>
          <p style={S.gateBlurb}>Signing in here covers every tool for this browser session.</p>
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
        </form>
      </main>
    );
  }

  return (
    <main style={S.page}>
      <header style={S.head}>
        <div>
          <h1 style={S.h1}>RentBolt admin</h1>
          <p style={S.sub}>Signed in for this browser session.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(PW_KEY);
            setAuthed(false);
            setPw("");
            setStats(null);
          }}
          style={S.ghost}
        >
          Sign out
        </button>
      </header>

      {stats && (
        <div style={S.statRow}>
          <Stat label="Leads today" value={stats.leadsToday} />
          <Stat label="Leads all time" value={stats.leadsTotal} />
          <Stat label="Live listings" value={stats.listings} />
          <Stat label="Hidden" value={stats.hidden} />
          <Stat
            label="Not in Monday"
            value={stats.undelivered}
            alert={stats.undelivered > 0}
            href={stats.undelivered > 0 ? "/admin/leads" : null}
          />
          <Stat
            label="Listings missing data"
            value={stats.needsAttention}
            warn={stats.needsAttention > 0}
            href={stats.needsAttention > 0 ? "/admin/listings" : null}
          />
        </div>
      )}

      <div style={S.grid}>
        {TOOLS.map(t => (
          <a key={t.href} href={t.href} style={S.card}>
            <div style={S.cardTitle}>{t.title}</div>
            <p style={S.cardBlurb}>{t.blurb}</p>
          </a>
        ))}
      </div>

      <p style={S.foot}>
        Listings, prices and descriptions are edited in Monday — this is only for what lives
        outside it.
      </p>
    </main>
  );
}

function Stat({ label, value, alert, warn, href }) {
  if (value === undefined || value === null) return null;
  const tone = alert ? { bg: "#FEF2F2", bd: "#FECACA", fg: "#991B1B" }
    : warn ? { bg: "#FFFBEB", bd: "#FDE68A", fg: "#92400E" }
    : { bg: "#F8FAFC", bd: "#EEF2F7", fg: NAVY };
  const inner = (
    <>
      <div style={{ ...S.statValue, color: tone.fg }}>{value}</div>
      <div style={S.statLabel}>{label}</div>
    </>
  );
  const style = { ...S.stat, background: tone.bg, borderColor: tone.bd, textDecoration: "none", display: "block" };
  return href ? <a href={href} style={style}>{inner}</a> : <div style={style}>{inner}</div>;
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

  page: { maxWidth: 940, margin: "0 auto", padding: "40px 24px 80px" },
  head: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 24 },
  h1: { margin: 0, fontSize: 28, fontWeight: 700, color: NAVY },
  sub: { margin: "6px 0 0", fontSize: 14, color: "#64748B" },

  statRow: { display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 26 },
  stat: { border: "1px solid #EEF2F7", borderRadius: 10, padding: "12px 16px", minWidth: 108 },
  statValue: { fontSize: 22, fontWeight: 700, lineHeight: 1.1 },
  statLabel: { fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: ".04em", marginTop: 4 },

  grid: { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" },
  card: {
    background: "#fff", border: "1px solid #E2E8F0", borderRadius: 12, padding: 20,
    textDecoration: "none", display: "block",
  },
  cardTitle: { fontSize: 17, fontWeight: 650, color: NAVY },
  cardBlurb: { margin: "6px 0 0", fontSize: 13, lineHeight: 1.55, color: "#64748B" },

  input: { minHeight: 42, padding: "0 12px", border: "1px solid #CBD5E1", borderRadius: 9, fontSize: 15 },
  primary: { minHeight: 42, border: 0, borderRadius: 9, background: NAVY, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  ghost: { minHeight: 36, padding: "0 12px", border: "1px solid #E2E8F0", borderRadius: 8, background: "#fff", color: "#475569", fontSize: 13, cursor: "pointer" },
  err: { background: "#FEF2F2", color: "#991B1B", border: "1px solid #FECACA", borderRadius: 8, padding: "10px 12px", fontSize: 13 },
  foot: { marginTop: 28, fontSize: 13, color: "#94A3B8", lineHeight: 1.6 },
};

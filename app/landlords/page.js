"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { meta } from "@/lib/brand";

const navy = "#0A1F5C";
const navyDark = "#040E2A";
const gold = "#C9A84C";
const goldLight = "#E2C87E";
const bg = "#F7F8FA";
const border = "#E8EBF0";
const textMid = "#5A6278";
const textMute = "#8B92A5";

const STATS = [
  { value: "4,000+", label: "Weekly rental inquiries" },
  { value: "5,000+", label: "Active units under mandate" },
  { value: "6", label: "Languages spoken" },
  { value: "$0", label: "Upfront cost" },
];

const WHY = [
  {
    icon: "🌍",
    title: "International reach",
    desc: "We actively recruit tenants from abroad — international students, relocating professionals, newcomers. Our team speaks 6 languages and handles everything from first contact to lease signing.",
  },
  {
    icon: "✅",
    title: "Pre-qualified tenants only",
    desc: "Every applicant goes through credit checks, employment or enrollment verification, and reference calls. You receive a vetted shortlist — not a pile of unscreened leads.",
  },
  {
    icon: "💸",
    title: "Pay only when we deliver",
    desc: "No retainer. No subscription. No upfront fees. Our commission is tied entirely to a completed signed lease. If we don't place a tenant, you don't pay.",
  },
  {
    icon: "📢",
    title: "Cross-market exposure",
    desc: "Your units get promoted across all our active markets simultaneously. A renter looking in Montreal might end up in your Ottawa building — we make those connections happen.",
  },
  {
    icon: "🤝",
    title: "We handle the leasing workload",
    desc: "Showings, follow-ups, applications, qualification — your team stays focused on operations while ours fills the units. We're an extension of your leasing department.",
  },
  {
    icon: "⚡",
    title: "Faster vacancy cycles",
    desc: "Our pre-qualified pipeline means dramatically shorter vacancy periods. We're not waiting for inquiries — we're matching your units to tenants actively looking right now.",
  },
];

const HOW = [
  { step: "01", title: "Sign a simple mandate", desc: "One-page agreement. No exclusivity required — we work alongside your existing channels." },
  { step: "02", title: "We list and promote", desc: "Your units go live across our platform and are pushed to our active tenant pool immediately." },
  { step: "03", title: "We qualify, you approve", desc: "We screen applicants and send you a vetted shortlist. You retain full approval rights." },
  { step: "04", title: "Lease signed, invoice sent", desc: "Once a lease is executed, we invoice a single placement fee. No ongoing costs." },
];

const CLIENTS = [
  "Large-scale building developers",
  "Multi-residential property managers",
  "Individual condo owners",
  "Student residence operators",
  "Corporate relocation partners",
  "Co-living operators",
];

const FAQS = [
  {
    q: "How much does RentBolt charge?",
    a: "Our fee is performance-based — typically one month's rent upon signing a lease. There are no upfront fees, no subscriptions, and no charges if we don't place a tenant.",
  },
  {
    q: "Do I have to give you exclusivity?",
    a: "No. We work non-exclusively alongside your existing channels — your own ads, other agencies, referrals. You keep full control of how you market your units.",
  },
  {
    q: "What markets do you cover?",
    a: "We're currently active in Montréal, Gatineau, Ottawa, Kitchener-Waterloo, London, and Hamilton. We're continuously expanding — reach out if you're in a nearby market.",
  },
  {
    q: "Who qualifies the tenants?",
    a: "We do. Our team runs credit checks, verifies employment or enrollment, and calls references before presenting any applicant to you. You only see candidates who've passed our screening.",
  },
  {
    q: "How quickly can you start?",
    a: "Fast. Once a mandate is signed, your units are typically live on our platform within 24–48 hours and pushed to our active tenant pool the same day.",
  },
  {
    q: "What property types do you work with?",
    a: "Apartments, condos, townhouses, student residences, co-living units, and furnished corporate rentals. If it's residential and in one of our markets, we can work with it.",
  },
];

const PORTFOLIO_TYPES = [
  { label: "1–5 units", value: "1-5" },
  { label: "6–20 units", value: "6-20" },
  { label: "21–100 units", value: "21-100" },
  { label: "100+ units", value: "100+" },
];

const INIT_FORM = { name: "", email: "", phone: "", company: "", city: "", portfolio: "", message: "" };

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      borderBottom: `1px solid ${border}`,
      overflow: "hidden",
    }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "20px 0", background: "none", border: "none", cursor: "pointer",
          fontFamily: "inherit", textAlign: "left", gap: 16,
        }}
      >
        <span style={{ fontSize: 15, fontWeight: 700, color: navy, lineHeight: 1.4 }}>{q}</span>
        <span style={{
          fontSize: 20, color: gold, flexShrink: 0, lineHeight: 1,
          transform: open ? "rotate(45deg)" : "rotate(0)", transition: "transform 0.2s",
        }}>+</span>
      </button>
      {open && (
        <p style={{ fontSize: 14, color: textMid, lineHeight: 1.7, margin: "0 0 20px", paddingRight: 32 }}>
          {a}
        </p>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
  border: `1.5px solid ${border}`, outline: "none", fontFamily: "inherit",
  color: navy, background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s",
};

function PartnershipForm() {
  const [form, setForm] = useState(INIT_FORM);
  const [focused, setFocused] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = form.name.trim() && form.email.trim();

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ textAlign: "center", padding: "48px 32px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <div style={{
          width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, ${navyDark} 0%, ${navy} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, color: gold,
        }}>✓</div>
        <h3 style={{ fontSize: 20, fontWeight: 800, color: navy, margin: 0 }}>Got it — we'll be in touch.</h3>
        <p style={{ fontSize: 14, color: textMid, margin: 0, lineHeight: 1.6 }}>
          Expect a call or email from our team within one business day.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* Name + Email */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input placeholder="Full name *" value={form.name} onChange={e => set("name", e.target.value)}
          onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
          style={{ ...inputStyle, borderColor: focused === "name" ? navy : border }} />
        <input type="email" placeholder="Email *" value={form.email} onChange={e => set("email", e.target.value)}
          onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
          style={{ ...inputStyle, borderColor: focused === "email" ? navy : border }} />
      </div>

      {/* Phone + Company */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <input type="tel" placeholder="Phone" value={form.phone} onChange={e => set("phone", e.target.value)}
          onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
          style={{ ...inputStyle, borderColor: focused === "phone" ? navy : border }} />
        <input placeholder="Company / Property name" value={form.company} onChange={e => set("company", e.target.value)}
          onFocus={() => setFocused("company")} onBlur={() => setFocused(null)}
          style={{ ...inputStyle, borderColor: focused === "company" ? navy : border }} />
      </div>

      {/* City + Portfolio size */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ position: "relative" }}>
          <select value={form.city} onChange={e => set("city", e.target.value)}
            style={{ ...inputStyle, appearance: "none", paddingRight: 36, cursor: "pointer", color: form.city ? navy : textMute }}>
            <option value="">City / Market</option>
            {["Montréal", "Gatineau", "Ottawa", "Kitchener-Waterloo", "London", "Hamilton", "Other"].map(c =>
              <option key={c} value={c}>{c}</option>
            )}
          </select>
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: textMute }}>▾</span>
        </div>
        <div style={{ display: "flex", gap: 0, borderRadius: 12, overflow: "hidden", border: `1.5px solid ${border}` }}>
          {PORTFOLIO_TYPES.map((p, i) => (
            <button key={p.value} type="button" onClick={() => set("portfolio", p.value)} style={{
              flex: 1, padding: "12px 4px", border: "none", borderLeft: i > 0 ? `1px solid ${border}` : "none",
              background: form.portfolio === p.value ? navy : "#fff",
              color: form.portfolio === p.value ? "#fff" : textMid,
              fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <textarea placeholder="Tell us about your vacancies (optional)" value={form.message} onChange={e => set("message", e.target.value)}
        onFocus={() => setFocused("msg")} onBlur={() => setFocused(null)}
        rows={3} style={{ ...inputStyle, borderColor: focused === "msg" ? navy : border, resize: "vertical", lineHeight: 1.6 }} />

      {/* Submit */}
      <button type="button" onClick={handleSubmit} disabled={!canSubmit || submitting} style={{
        width: "100%", padding: "15px 24px", borderRadius: 12, border: "none",
        fontSize: 15, fontWeight: 800, fontFamily: "inherit", cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
        background: canSubmit && !submitting ? `linear-gradient(135deg, ${navyDark} 0%, ${navy} 100%)` : "#C5CBE0",
        color: "#fff", boxShadow: canSubmit && !submitting ? "0 6px 24px rgba(10,31,92,0.25)" : "none",
        transition: "all 0.2s",
      }}>
        {submitting ? "Sending…" : "Get in Touch →"}
      </button>
      {!canSubmit && (
        <p style={{ textAlign: "center", fontSize: 12, color: textMute, margin: 0 }}>Name and email required</p>
      )}
    </div>
  );
}

export default function LandlordsPage() {
  return (
    <>
      <Header />

      {/* ── HERO ── */}
      <section style={{
        background: `linear-gradient(135deg, ${navyDark} 0%, ${navy} 55%, #1A3278 100%)`,
        color: "#fff", padding: "90px 32px 100px",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>
              For Property Owners & Managers
            </p>
            <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 800, lineHeight: 1.1, margin: "0 0 22px", letterSpacing: "-1px" }}>
              The leasing partner<br />
              <span style={{ color: gold }}>your properties deserve.</span>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.65)", maxWidth: 460, lineHeight: 1.7, marginBottom: 32 }}>
              RentBolt refers pre-qualified tenants to property owners and managers across Quebec and Ontario. Performance-based — you only pay when we deliver a signed lease.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              <a href="#contact" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: gold, color: navy, padding: "14px 28px",
                borderRadius: 12, fontWeight: 800, fontSize: 15, textDecoration: "none",
                boxShadow: `0 4px 20px rgba(201,168,76,0.35)`,
              }}>
                Get Started →
              </a>
              <a href={meta.calendly} target="_blank" rel="noopener noreferrer" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: "rgba(255,255,255,0.08)", color: "#fff", padding: "14px 28px",
                borderRadius: 12, fontWeight: 700, fontSize: 15, textDecoration: "none",
                border: "1.5px solid rgba(255,255,255,0.18)",
              }}>
                Book a Discovery Call
              </a>
            </div>
          </div>

          {/* Hero stat card */}
          <div style={{
            background: "rgba(255,255,255,0.06)", borderRadius: 20, padding: "36px 32px",
            border: "1.5px solid rgba(255,255,255,0.12)", backdropFilter: "blur(12px)",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 24 }}>
              Why partners choose us
            </p>
            {[
              { icon: "⚡", text: "Units listed within 24 hours of signing" },
              { icon: "✅", text: "Every applicant fully screened before you see them" },
              { icon: "🌍", text: "International tenant pipeline you can't build alone" },
              { icon: "💸", text: "Zero cost until a lease is signed" },
              { icon: "📊", text: "4,000+ active rental inquiries per week" },
            ].map(item => (
              <div key={item.text} style={{
                display: "flex", alignItems: "flex-start", gap: 14,
                padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.07)",
              }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section style={{ background: "#fff", borderBottom: `1px solid ${border}`, padding: "44px 32px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, textAlign: "center" }}>
          {STATS.map((s, i) => (
            <div key={s.label} style={{ padding: "0 24px", borderRight: i < STATS.length - 1 ? `1px solid ${border}` : "none" }}>
              <div style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 800, color: navy, letterSpacing: "-1px", lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: textMute, fontWeight: 500, marginTop: 6 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHO WE WORK WITH ── */}
      <section style={{ background: bg, padding: "80px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>
              Who we work with
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 800, color: navy, margin: "0 0 18px", lineHeight: 1.2 }}>
              Trusted by some of Canada's largest owners and managers
            </h2>
            <p style={{ fontSize: 15, color: textMid, lineHeight: 1.7, marginBottom: 28 }}>
              From individual condo owners to multi-hundred-unit portfolios — if you have residential vacancies in Quebec or Ontario, we're built to fill them.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {CLIENTS.map((c) => (
                <div key={c} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "rgba(201,168,76,0.15)", display: "flex",
                    alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: gold, fontWeight: 700,
                  }}>✓</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: navy }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Markets card */}
          <div style={{
            background: `linear-gradient(135deg, ${navyDark} 0%, ${navy} 100%)`,
            borderRadius: 20, padding: "36px 32px", color: "#fff",
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 20 }}>
              Our markets
            </p>
            {[
              { city: "Montréal", tag: "QC — Flagship" },
              { city: "Gatineau", tag: "QC — Growing" },
              { city: "Ottawa", tag: "ON — Active" },
              { city: "Kitchener-Waterloo", tag: "ON — Active" },
              { city: "London", tag: "ON — Active" },
              { city: "Hamilton", tag: "ON — Expanding" },
            ].map((m) => (
              <div key={m.city} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.08)",
              }}>
                <span style={{ fontWeight: 700, fontSize: 14 }}>{m.city}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontWeight: 500 }}>{m.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY RENTBOLT ── */}
      <section style={{ background: "#fff", padding: "80px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Why RentBolt
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: navy, margin: "0 0 14px", lineHeight: 1.2 }}>
              Built differently from day one
            </h2>
            <p style={{ fontSize: 16, color: textMid, maxWidth: 500, margin: "0 auto", lineHeight: 1.65 }}>
              We built the leasing infrastructure so you don't have to maintain it.
            </p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {WHY.map((item) => (
              <div key={item.title} style={{
                background: bg, borderRadius: 16, padding: "28px 24px",
                border: `1.5px solid #ECEEF3`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 14 }}>{item.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: navy, margin: "0 0 10px", lineHeight: 1.3 }}>
                  {item.title}
                </h3>
                <p style={{ fontSize: 13, color: textMid, lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ background: bg, padding: "80px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 52 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Simple process
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: navy, margin: 0, lineHeight: 1.2 }}>
              How the partnership works
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0, position: "relative" }}>
            {HOW.map((step, i) => (
              <div key={step.step} style={{ textAlign: "center", padding: "0 20px", position: "relative" }}>
                {i < HOW.length - 1 && (
                  <div style={{
                    position: "absolute", top: 28, left: "60%", width: "80%", height: 2,
                    background: `linear-gradient(to right, ${gold}, ${border})`, zIndex: 0,
                  }} />
                )}
                <div style={{
                  width: 56, height: 56, borderRadius: "50%", margin: "0 auto 20px",
                  background: `linear-gradient(135deg, ${navyDark} 0%, ${navy} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: gold, position: "relative", zIndex: 1,
                }}>
                  {step.step}
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: navy, margin: "0 0 8px" }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: textMid, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#fff", padding: "80px 32px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12 }}>
              Common questions
            </p>
            <h2 style={{ fontSize: "clamp(24px, 3.5vw, 38px)", fontWeight: 800, color: navy, margin: 0, lineHeight: 1.2 }}>
              Everything you need to know
            </h2>
          </div>
          <div style={{ borderTop: `1px solid ${border}` }}>
            {FAQS.map(faq => <FaqItem key={faq.q} q={faq.q} a={faq.a} />)}
          </div>
        </div>
      </section>

      {/* ── CONTACT FORM ── */}
      <section id="contact" style={{ background: bg, padding: "80px 32px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "start" }}>
          {/* Left copy */}
          <div style={{ paddingTop: 8 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: gold, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
              Let's talk
            </p>
            <h2 style={{ fontSize: "clamp(26px, 4vw, 40px)", fontWeight: 800, color: navy, margin: "0 0 18px", lineHeight: 1.15, letterSpacing: "-0.5px" }}>
              Ready to fill your vacancies faster?
            </h2>
            <p style={{ fontSize: 15, color: textMid, lineHeight: 1.7, marginBottom: 32 }}>
              Tell us about your properties and we'll reach out within one business day. Prefer a call? Book directly below.
            </p>
            <a href={meta.calendly} target="_blank" rel="noopener noreferrer" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              background: gold, color: navy, padding: "13px 24px",
              borderRadius: 12, fontWeight: 800, fontSize: 14, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(201,168,76,0.3)", marginBottom: 32,
            }}>
              📞 Book a Discovery Call
            </a>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <a href={`tel:${meta.phone}`} style={{ fontSize: 14, color: textMid, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: gold }}>📱</span> {meta.phone}
              </a>
              <a href={`mailto:${meta.email}`} style={{ fontSize: 14, color: textMid, textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: gold }}>✉️</span> {meta.email}
              </a>
            </div>
          </div>

          {/* Right form */}
          <div style={{
            background: "#fff", borderRadius: 20, padding: "36px 32px",
            boxShadow: "0 4px 32px rgba(10,31,92,0.08)", border: `1px solid ${border}`,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: navy, margin: "0 0 6px" }}>Get in touch</h3>
            <p style={{ fontSize: 13, color: textMute, margin: "0 0 24px" }}>We respond within one business day.</p>
            <PartnershipForm />
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

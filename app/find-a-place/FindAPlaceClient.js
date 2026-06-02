"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";

const CITIES = ["Montréal", "Gatineau", "Ottawa", "Kitchener-Waterloo", "London", "Hamilton"];
const UNIT_TYPES = ["Studio", "1 Bedroom", "2 Bedrooms", "3 Bedrooms", "4+ Bedrooms", "Loft", "Townhouse"];
const MUST_HAVES = ["Parking", "In-suite laundry", "Balcony", "AC", "Dishwasher", "Gym", "Pool", "Storage", "EV charging", "Concierge", "Elevator", "Rooftop"];
const PET_TYPES = ["Cat", "Small Dog (<25 lbs)", "Large Dog (>25 lbs)"];

const BUDGET_MIN = 500;
const BUDGET_MAX = 5000;
const BUDGET_STEP = 50;

const INITIAL = {
  city: "", unitTypes: [], budgetMin: 800, budgetMax: 2500,
  moveInDate: "", flexible: false, furnished: "", pets: "",
  petTypes: [], mustHaves: [], notes: "", name: "", email: "", phone: "",
};

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="28" height="28" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z"
        fill="url(#fap-bolt)" stroke="url(#fap-bolt)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="fap-bolt" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} style={{
      position: "relative", display: "inline-flex", alignItems: "center",
      width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer",
      background: checked ? brand.navy : "#D1D5DB", transition: "background 0.2s", flexShrink: 0,
    }}>
      <span style={{
        position: "absolute", left: checked ? 22 : 2,
        width: 20, height: 20, borderRadius: "50%", background: "#fff",
        boxShadow: "0 1px 3px rgba(0,0,0,0.2)", transition: "left 0.2s",
      }}/>
    </button>
  );
}

function Pill({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 100, fontSize: 13, fontWeight: 600,
      cursor: "pointer", transition: "all 0.15s", border: `1.5px solid ${active ? brand.navy : "#E2E5EC"}`,
      background: active ? brand.navy : "#fff", color: active ? "#fff" : "#5A6278",
      fontFamily: "inherit",
    }}>
      {active && "✓ "}{label}
    </button>
  );
}

function SegmentBtn({ label, active, onClick }) {
  return (
    <button type="button" onClick={onClick} style={{
      flex: 1, padding: "10px 8px", borderRadius: 10, fontSize: 13, fontWeight: 700,
      cursor: "pointer", transition: "all 0.15s", fontFamily: "inherit",
      border: `1.5px solid ${active ? brand.navy : "#E2E5EC"}`,
      background: active ? brand.navy : "#fff", color: active ? "#fff" : "#5A6278",
    }}>
      {label}
    </button>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: brand.navy, display: "flex", alignItems: "center", gap: 6 }}>
        {label}
        {required && <span style={{ color: brand.gold }}>*</span>}
        {hint && <span style={{ fontSize: 12, fontWeight: 400, color: "#8B92A5" }}>{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function BudgetSlider({ min, max, onMinChange, onMaxChange }) {
  const pct = (v) => ((v - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;
  const fmt = (v) => v >= BUDGET_MAX ? "$5,000+" : `$${v.toLocaleString()}`;

  const trackStyle = {
    position: "relative", height: 6, borderRadius: 3,
    background: `linear-gradient(to right, #E2E5EC ${pct(min)}%, ${brand.navy} ${pct(min)}%, ${brand.navy} ${pct(max)}%, #E2E5EC ${pct(max)}%)`,
    margin: "12px 0",
  };

  const sliderBase = {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    width: "100%", height: 6, opacity: 0, cursor: "pointer",
    WebkitAppearance: "none", appearance: "none", margin: 0,
  };

  return (
    <div>
      {/* Labels */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: "#8B92A5" }}>Min</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: brand.navy }}>
          {fmt(min)} — {fmt(max)}
        </span>
        <span style={{ fontSize: 13, color: "#8B92A5" }}>Max</span>
      </div>

      {/* Track + overlapping range inputs */}
      <div style={{ position: "relative", height: 28, display: "flex", alignItems: "center" }}>
        <div style={{ ...trackStyle, width: "100%" }} />
        <input
          type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP}
          value={min}
          onChange={e => { const v = Math.min(Number(e.target.value), max - BUDGET_STEP); onMinChange(v); }}
          style={{ ...sliderBase, pointerEvents: "auto", zIndex: min > BUDGET_MAX - 200 ? 5 : 3 }}
        />
        <input
          type="range" min={BUDGET_MIN} max={BUDGET_MAX} step={BUDGET_STEP}
          value={max}
          onChange={e => { const v = Math.max(Number(e.target.value), min + BUDGET_STEP); onMaxChange(v); }}
          style={{ ...sliderBase, pointerEvents: "auto", zIndex: 4 }}
        />
      </div>

      <p style={{ fontSize: 12, color: "#8B92A5", marginTop: 8, fontStyle: "italic" }}>
        We'll do our best to respect it 🙏
      </p>

      {/* Slider thumb styles via injected CSS */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px; height: 22px; border-radius: 50%;
          background: ${brand.navy};
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(10,31,92,0.25);
          cursor: pointer;
          pointer-events: all;
        }
        input[type=range]::-moz-range-thumb {
          width: 22px; height: 22px; border-radius: 50%;
          background: ${brand.navy};
          border: 3px solid #fff;
          box-shadow: 0 2px 6px rgba(10,31,92,0.25);
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "12px 16px", borderRadius: 12, fontSize: 14, fontWeight: 500,
  border: "1.5px solid #E2E5EC", outline: "none", fontFamily: "inherit",
  color: brand.navy, background: "#fff", boxSizing: "border-box", transition: "border-color 0.15s",
};

export default function FindAPlaceClient() {
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k, v) => set(k, form[k].includes(v) ? form[k].filter(x => x !== v) : [...form[k], v]);

  const canSubmit = form.name.trim() && form.email.trim() && form.city;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    await new Promise(r => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <>
      {/* HEADER */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100, background: "#fff",
        borderBottom: "1px solid #E8EBF0", padding: "0 32px", height: 64,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Bolt />
          <span style={{ fontWeight: 800, fontSize: 20, color: brand.navy, letterSpacing: "-0.5px" }}>RENTBOLT</span>
        </a>
        <a href="/" style={{ fontSize: 13, fontWeight: 600, color: "#5A6278", textDecoration: "none" }}>
          ← Back to listings
        </a>
      </header>

      <main style={{ minHeight: "100vh", background: "#F7F8FA", paddingBottom: 80 }}>
        {submitted ? <SuccessState name={form.name} /> : (
          <>
            {/* HERO */}
            <div style={{
              background: `linear-gradient(135deg, ${brand.navyDark} 0%, ${brand.navy} 60%, #1A3278 100%)`,
              color: "#fff", padding: "56px 32px 52px", textAlign: "center",
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: brand.gold, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 }}>
                Let's find your home
              </p>
              <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 800, margin: "0 0 16px", lineHeight: 1.15 }}>
                Tell us what you're looking for
              </h1>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", maxWidth: 480, margin: "0 auto" }}>
                A RentBolt agent will match you with available units — usually within a few hours.
              </p>
            </div>

            {/* FORM CARD */}
            <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 16px" }}>
              <div style={{
                background: "#fff", borderRadius: 20, boxShadow: "0 4px 32px rgba(10,31,92,0.08)",
                overflow: "hidden", marginTop: -24, position: "relative",
              }}>

                {/* WHERE & WHAT */}
                <Section title="Where & What" icon="📍">
                  <Field label="Where do you want to live?" required>
                    <div style={{ position: "relative" }}>
                      <select
                        value={form.city} onChange={e => set("city", e.target.value)}
                        style={{ ...inputStyle, appearance: "none", paddingRight: 40, cursor: "pointer" }}
                      >
                        <option value="">Select a city…</option>
                        {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <span style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "#8B92A5" }}>▾</span>
                    </div>
                  </Field>

                  <Field label="Unit type" hint="(pick all that apply)">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {UNIT_TYPES.map(t => (
                        <Pill key={t} label={t} active={form.unitTypes.includes(t)} onClick={() => toggleArr("unitTypes", t)} />
                      ))}
                    </div>
                  </Field>
                </Section>

                <Divider />

                {/* BUDGET */}
                <Section title="Budget" icon="💰">
                  <Field label="Monthly budget range">
                    <BudgetSlider
                      min={form.budgetMin} max={form.budgetMax}
                      onMinChange={v => set("budgetMin", v)}
                      onMaxChange={v => set("budgetMax", v)}
                    />
                  </Field>
                </Section>

                <Divider />

                {/* MOVE-IN */}
                <Section title="Desired move-in date" icon="📅">
                  <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <input
                        type="date" value={form.moveInDate}
                        onChange={e => set("moveInDate", e.target.value)}
                        disabled={form.flexible}
                        onFocus={() => setFocused("date")} onBlur={() => setFocused(null)}
                        style={{
                          ...inputStyle,
                          borderColor: focused === "date" ? brand.navy : "#E2E5EC",
                          opacity: form.flexible ? 0.4 : 1,
                          cursor: form.flexible ? "not-allowed" : "text",
                        }}
                      />
                    </div>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" }}>
                      <Toggle checked={form.flexible} onChange={v => set("flexible", v)} />
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#5A6278" }}>I'm flexible</span>
                    </label>
                  </div>
                </Section>

                <Divider />

                {/* PREFERENCES */}
                <Section title="Preferences" icon="✨">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                    <Field label="Furnished?">
                      <div style={{ display: "flex", gap: 8 }}>
                        {["Yes", "No", "Either"].map(o => (
                          <SegmentBtn key={o} label={o} active={form.furnished === o} onClick={() => set("furnished", o)} />
                        ))}
                      </div>
                    </Field>

                    <Field label="Pets?">
                      <div style={{ display: "flex", gap: 8 }}>
                        {["Yes", "No"].map(o => (
                          <SegmentBtn key={o} label={o} active={form.pets === o} onClick={() => set("pets", o)} />
                        ))}
                      </div>
                    </Field>
                  </div>

                  {/* Pet type follow-up */}
                  {form.pets === "Yes" && (
                    <div style={{
                      background: "#F7F8FA", borderRadius: 12, padding: "16px 20px",
                      border: "1.5px solid #E2E5EC", display: "flex", flexDirection: "column", gap: 10,
                    }}>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: brand.navy }}>
                        What kind of pet? <span style={{ fontWeight: 400, color: "#8B92A5" }}>(pick all that apply)</span>
                      </p>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                        {PET_TYPES.map(p => (
                          <Pill key={p} label={p} active={form.petTypes.includes(p)} onClick={() => toggleArr("petTypes", p)} />
                        ))}
                      </div>
                    </div>
                  )}

                  <Field label="Must-haves" hint="(pick all that apply)">
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {MUST_HAVES.map(m => (
                        <Pill key={m} label={m} active={form.mustHaves.includes(m)} onClick={() => toggleArr("mustHaves", m)} />
                      ))}
                    </div>
                  </Field>
                </Section>

                <Divider />

                {/* ANYTHING ELSE */}
                <Section title="Anything else?" icon="💬">
                  <Field label="Additional notes" hint="(optional)">
                    <textarea
                      placeholder="e.g. I need a quiet building, close to a metro station, ground floor preferred…"
                      value={form.notes}
                      onChange={e => set("notes", e.target.value)}
                      onFocus={() => setFocused("notes")} onBlur={() => setFocused(null)}
                      rows={4}
                      style={{
                        ...inputStyle,
                        borderColor: focused === "notes" ? brand.navy : "#E2E5EC",
                        resize: "vertical", lineHeight: 1.6,
                      }}
                    />
                  </Field>
                </Section>

                <Divider />

                {/* CONTACT */}
                <Section title="Your info" icon="👤">
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <input
                      type="text" placeholder="Full name *"
                      value={form.name} onChange={e => set("name", e.target.value)}
                      onFocus={() => setFocused("name")} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle, borderColor: focused === "name" ? brand.navy : "#E2E5EC" }}
                    />
                    <input
                      type="email" placeholder="Email address *"
                      value={form.email} onChange={e => set("email", e.target.value)}
                      onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle, borderColor: focused === "email" ? brand.navy : "#E2E5EC" }}
                    />
                    <input
                      type="tel" placeholder="Phone (optional)"
                      value={form.phone} onChange={e => set("phone", e.target.value)}
                      onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)}
                      style={{ ...inputStyle, borderColor: focused === "phone" ? brand.navy : "#E2E5EC" }}
                    />
                  </div>
                </Section>

                {/* SUBMIT */}
                <div style={{ padding: "24px 32px 32px" }}>
                  <button
                    type="button" onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    style={{
                      width: "100%", padding: "16px 24px", borderRadius: 14, border: "none",
                      fontSize: 16, fontWeight: 800, cursor: canSubmit && !submitting ? "pointer" : "not-allowed",
                      fontFamily: "inherit", transition: "all 0.2s", letterSpacing: "-0.2px",
                      background: canSubmit && !submitting
                        ? `linear-gradient(135deg, ${brand.navyDark} 0%, ${brand.navy} 100%)`
                        : "#C5CBE0",
                      color: "#fff",
                      boxShadow: canSubmit && !submitting ? "0 6px 24px rgba(10,31,92,0.25)" : "none",
                    }}
                  >
                    {submitting ? "Sending…" : "Find My Place →"}
                  </button>
                  {(!form.name || !form.email || !form.city) && (
                    <p style={{ textAlign: "center", fontSize: 12, color: "#8B92A5", marginTop: 10 }}>
                      City, name and email are required
                    </p>
                  )}
                </div>

              </div>
            </div>
          </>
        )}
      </main>

      <footer style={{
        background: brand.navyDark, color: "rgba(255,255,255,0.5)",
        textAlign: "center", padding: "24px 32px", fontSize: 13,
      }}>
        © 2026 RentBolt · <a href="mailto:hello@rentbolt.ca" style={{ color: brand.gold, textDecoration: "none" }}>hello@rentbolt.ca</a>
      </footer>
    </>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: brand.navy, letterSpacing: "-0.2px" }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#F0F2F7", margin: "0 32px" }} />;
}

function SuccessState({ name }) {
  const first = name.split(" ")[0];
  return (
    <div style={{
      maxWidth: 480, margin: "60px auto", padding: "0 16px",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: 24,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
        background: `linear-gradient(135deg, ${brand.navyDark} 0%, ${brand.navy} 100%)`,
        fontSize: 36, color: brand.gold,
      }}>✓</div>
      <div>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: brand.navy, margin: "0 0 12px" }}>
          You're on the list, {first}!
        </h2>
        <p style={{ fontSize: 16, color: "#5A6278", lineHeight: 1.6, margin: 0 }}>
          A RentBolt agent will reach out with matching units — keep an eye on your inbox.
        </p>
      </div>
      <a href="/" style={{
        padding: "14px 32px", borderRadius: 12, fontSize: 15, fontWeight: 700,
        background: brand.gold, color: brand.navy, textDecoration: "none",
        boxShadow: "0 4px 16px rgba(201,168,76,0.3)",
      }}>
        Browse listings →
      </a>
    </div>
  );
}

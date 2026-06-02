"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ChevronDown, Check, Loader2 } from "lucide-react";

const CITIES = [
  "Montréal",
  "Gatineau",
  "Ottawa",
  "Kitchener-Waterloo",
  "London",
  "Hamilton",
];

const UNIT_TYPES = [
  "Studio",
  "1 Bedroom",
  "2 Bedrooms",
  "3 Bedrooms",
  "4+ Bedrooms",
  "Loft",
  "Townhouse",
];

const MUST_HAVES = [
  "Parking",
  "In-suite laundry",
  "Pet-friendly",
  "Furnished",
  "Balcony",
  "AC",
  "Dishwasher",
  "Gym",
  "Pool",
  "Storage",
  "EV charging",
  "Concierge",
];

const INITIAL = {
  city: "",
  unitTypes: [],
  budgetMin: "",
  budgetMax: "",
  moveInDate: "",
  flexible: false,
  furnished: "",
  pets: "",
  mustHaves: [],
  name: "",
  email: "",
  phone: "",
};

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
        checked ? "bg-navy" : "bg-gray-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
      <span className="sr-only">{label}</span>
    </button>
  );
}

function MultiPill({ options, selected, onChange }) {
  const toggle = (val) =>
    onChange(
      selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    );
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all ${
              active
                ? "bg-navy text-white border-navy"
                : "bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy"
            }`}
          >
            {active && <Check size={11} className="inline mr-1 -mt-0.5" />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}

export default function FindAPlaceModal({ open, onClose }) {
  const [form, setForm] = useState(INITIAL);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setForm(INITIAL);
        setSubmitted(false);
        setSubmitting(false);
      }, 300);
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // Close on Escape
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );
  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  const set = (field, val) => setForm((f) => ({ ...f, [field]: val }));

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.city) return;
    setSubmitting(true);
    // No backend yet — simulate delay
    await new Promise((r) => setTimeout(r, 900));
    setSubmitting(false);
    setSubmitted(true);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
        onClick={onClose}
        style={{ animation: "rbFadeIn 0.2s ease" }}
      />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col"
        style={{ animation: "rbSlideUp 0.3s cubic-bezier(.16,1,.3,1)" }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <SuccessState name={form.name} onClose={onClose} />
        ) : (
          <FormBody
            form={form}
            set={set}
            submitting={submitting}
            onSubmit={handleSubmit}
          />
        )}
      </div>

      <style jsx global>{`
        @keyframes rbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes rbSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function FormBody({ form, set, submitting, onSubmit }) {
  const canSubmit = form.name.trim() && form.email.trim() && form.city;

  return (
    <>
      {/* Header */}
      <div className="px-6 pt-7 pb-5 border-b border-gray-100">
        <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1">
          Let's find your home
        </p>
        <h2 className="text-2xl font-extrabold text-navy font-display leading-tight">
          Tell us what you're looking for
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          A RentBolt agent will match you with available units — usually within a few hours.
        </p>
      </div>

      {/* Body */}
      <div className="px-6 py-6 flex flex-col gap-6 flex-1">
        {/* City */}
        <Field label="Which city?" required>
          <div className="relative">
            <select
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              className="w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm font-semibold text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all pr-10"
            >
              <option value="">Select a city</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </Field>

        {/* Unit type */}
        <Field label="What type of unit?">
          <MultiPill
            options={UNIT_TYPES}
            selected={form.unitTypes}
            onChange={(v) => set("unitTypes", v)}
          />
        </Field>

        {/* Budget */}
        <Field label="Monthly budget">
          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
              <input
                type="number"
                placeholder="Min"
                value={form.budgetMin}
                onChange={(e) => set("budgetMin", e.target.value)}
                className="w-full pl-7 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
              />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-semibold">$</span>
              <input
                type="number"
                placeholder="Max"
                value={form.budgetMax}
                onChange={(e) => set("budgetMax", e.target.value)}
                className="w-full pl-7 pr-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
              />
            </div>
          </div>
        </Field>

        {/* Move-in date */}
        <Field label="Move-in date">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <input
              type="date"
              value={form.moveInDate}
              onChange={(e) => set("moveInDate", e.target.value)}
              disabled={form.flexible}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            />
            <label className="flex items-center gap-2.5 cursor-pointer select-none shrink-0">
              <Toggle
                checked={form.flexible}
                onChange={(v) => set("flexible", v)}
                label="I'm flexible"
              />
              <span className="text-sm font-semibold text-gray-600">I'm flexible</span>
            </label>
          </div>
        </Field>

        {/* Furnished + Pets */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Furnished?">
            <div className="flex gap-2">
              {["Yes", "No", "Either"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("furnished", opt)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.furnished === opt
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Pets?">
            <div className="flex gap-2">
              {["Yes", "No"].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => set("pets", opt)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
                    form.pets === opt
                      ? "bg-navy text-white border-navy"
                      : "bg-white text-gray-600 border-gray-200 hover:border-navy hover:text-navy"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </Field>
        </div>

        {/* Must-haves */}
        <Field label="Must-haves">
          <MultiPill
            options={MUST_HAVES}
            selected={form.mustHaves}
            onChange={(v) => set("mustHaves", v)}
          />
        </Field>

        {/* Divider */}
        <div className="border-t border-gray-100" />

        {/* Contact */}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
            Your contact info
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Full name *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
            />
            <input
              type="email"
              placeholder="Email address *"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
            />
            <input
              type="tel"
              placeholder="Phone number (optional)"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-navy placeholder:font-normal placeholder:text-gray-400 focus:outline-none focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div className="px-6 pb-7 pt-4 border-t border-gray-100 bg-white sticky bottom-0 rounded-b-3xl">
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit || submitting}
          className="w-full py-4 rounded-2xl text-base font-extrabold transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: canSubmit && !submitting
              ? "linear-gradient(135deg, #0A1F5C 0%, #1A3278 100%)"
              : undefined,
            backgroundColor: (!canSubmit || submitting) ? "#0A1F5C" : undefined,
            color: "#fff",
            boxShadow: canSubmit && !submitting
              ? "0 4px 20px rgba(10,31,92,0.3)"
              : "none",
          }}
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Sending…
            </>
          ) : (
            "Find My Place →"
          )}
        </button>
        {(!form.name || !form.email || !form.city) && (
          <p className="text-xs text-center text-gray-400 mt-2">
            City, name and email required
          </p>
        )}
      </div>
    </>
  );
}

function SuccessState({ name, onClose }) {
  const first = name.split(" ")[0];
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center gap-6 min-h-[360px]">
      {/* Animated checkmark */}
      <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0A1F5C 0%, #1A3278 100%)" }}>
        <Check size={36} strokeWidth={3} color="#C9A84C" />
      </div>
      <div>
        <h3 className="text-2xl font-extrabold text-navy font-display">
          You're on the list, {first}!
        </h3>
        <p className="text-gray-500 mt-2 text-sm max-w-xs mx-auto">
          A RentBolt agent will reach out shortly with matching units. Keep an eye on your inbox.
        </p>
      </div>
      <button
        onClick={onClose}
        className="px-8 py-3 rounded-2xl text-sm font-bold text-white"
        style={{ background: "linear-gradient(135deg, #C9A84C 0%, #A8882E 100%)" }}
      >
        Close
      </button>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-bold text-navy mb-2">
        {label}
        {required && <span className="text-gold ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}
// cache bust Tue Jun  2 13:50:56 UTC 2026

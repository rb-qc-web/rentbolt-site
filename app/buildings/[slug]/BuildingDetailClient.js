"use client";

import "./detail.css";

import { useEffect, useState } from "react";
import FavouriteButton from "@/app/components/FavouriteButton";
import SavedNavLink from "@/app/components/SavedNavLink";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import FindAPlaceModal from "@/components/FindAPlaceModal";
import { submitLead } from "@/lib/submitLead";

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" width="26" height="26" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="url(#bd-bolt)" stroke="url(#bd-bolt)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="bd-bolt" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

function formatBedsLong(beds) {
  if (!beds || beds.length === 0) return null;
  return beds.map(b => b === 0 ? "Studios" : b === 4 ? "4+ Bedrooms" : `${b} Bedroom${b > 1 ? "s" : ""}`).join(" · ");
}

// Emoji maps for rich pill display
const AMENITY_ICONS = {
  "gym": "🏋️", "fitness": "🏋️", "fitness center": "🏋️",
  "pool": "🏊", "swimming": "🏊",
  "rooftop": "🌇", "rooftop terrace": "🌇",
  "concierge": "🛎️",
  "parking": "🚗", "garage": "🚗",
  "storage": "📦", "storage lockers": "📦",
  "lounge": "🛋️", "lounge area": "🛋️",
  "party room": "🎉", "party": "🎉",
  "game room": "🎮", "games": "🎮",
  "kids": "🧒", "kids playroom": "🧒", "playground": "🧒",
  "bbq": "🔥", "terrace": "🌿",
  "bike": "🚲", "bicycle": "🚲",
  "spa": "🧖", "sauna": "🧖",
  "theatre": "🎬", "theater": "🎬", "movie": "🎬",
  "coworking": "💻", "business center": "💻",
  "visitor parking": "🅿️",
  "elevator": "🛗",
  "security": "🔒", "doorman": "🔒",
  "ev charging": "⚡", "ev": "⚡",
};

const APPLIANCE_ICONS = {
  "fridge": "🧊", "refrigerator": "🧊",
  "stove": "🍳", "oven": "🍳", "range": "🍳",
  "dishwasher": "🫧",
  "microwave": "📡",
  "washer": "🫧", "dryer": "🫧",
  "laundry in building": "👕", "laundry in unit": "👕", "laundry": "👕",
  "air conditioning": "❄️", "ac": "❄️", "a/c": "❄️",
  "balcony": "🌿",
};

const INCLUSION_ICONS = {
  "heating": "🔥",
  "hot water": "💧", "water": "💧",
  "electricity": "⚡",
  "internet": "📶", "wifi": "📶",
  "cable": "📺",
  "pet friendly": "🐾", "pets": "🐾",
  "furnished": "🛋️",
  "parking": "🚗",
  "hydro": "⚡",
  "gas": "🔥",
};

function getIcon(name, map) {
  const key = name.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (key.includes(k)) return v;
  }
  return null;
}

function PhotoLightbox({ photos, index, onIndexChange, onClose, alt }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onIndexChange((i) => (i + 1) % photos.length);
      if (e.key === "ArrowLeft") onIndexChange((i) => (i - 1 + photos.length) % photos.length);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [photos.length, onClose, onIndexChange]);

  const goNext = (e) => { e.stopPropagation(); onIndexChange((i) => (i + 1) % photos.length); };
  const goPrev = (e) => { e.stopPropagation(); onIndexChange((i) => (i - 1 + photos.length) % photos.length); };

  return (
    <div className="bd-lightbox" onClick={onClose}>
      <button className="bd-lightbox-close" onClick={onClose} aria-label="Close">✕</button>
      <span className="bd-lightbox-count">{index + 1} / {photos.length}</span>

      {photos.length > 1 && (
        <button className="bd-lightbox-nav bd-lightbox-prev" onClick={goPrev} aria-label="Previous photo">‹</button>
      )}

      <img
        src={photos[index]}
        alt={`${alt} photo ${index + 1}`}
        className="bd-lightbox-img"
        onClick={(e) => e.stopPropagation()}
      />

      {photos.length > 1 && (
        <button className="bd-lightbox-nav bd-lightbox-next" onClick={goNext} aria-label="Next photo">›</button>
      )}

      {photos.length > 1 && (
        <div className="bd-lightbox-thumbs" onClick={(e) => e.stopPropagation()}>
          {photos.map((url, i) => (
            <button
              key={i}
              className={`bd-lightbox-thumb${i === index ? " active" : ""}`}
              onClick={(e) => { e.stopPropagation(); onIndexChange(i); }}
            >
              <img src={url} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function BuildingDetailClient({ building }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const openLightbox = (i) => { setActivePhoto(i); setLightboxOpen(true); };
  const [form, setForm] = useState({
    name: "", email: "", phone: "", visitType: "in-person", moveIn: "", message: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  // Build inclusions list
  const inclusions = [];
  if (building.heatingIncl) inclusions.push("Heating");
  if (building.waterIncl) inclusions.push("Hot water");
  if (building.electricityIncl) inclusions.push("Electricity");
  if (building.internetIncl) inclusions.push("Internet");

  const bedsLabel = formatBedsLong(building.bedrooms);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      setError("Please provide your name and email.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await submitLead({
        kind: "visit",
        ...form,
        building: {
          id: building.id,
          slug: building.slug,
          name: building.publicName || building.name,
          city: building.city,
        },
      });
      setSubmitted(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Falls back to the city image when a building has no uploaded photos.
  const gallery = building.photoGallery?.length > 0
    ? building.photoGallery
    : [getBuildingPhoto(building)];
  const hasRealGallery = building.photoGallery?.length > 1;

  return (
    <>
      {/* HEADER */}
      <header className="bd-header">
        <a href="/" className="bd-logo">
          <Bolt />
          RentBolt
        </a>
        <nav className="bd-nav">
          <a href="/search">Search</a>
          <a href="/landlords">Property Owners</a>
            <SavedNavLink />
          <a href="/find-a-place" className="bd-nav-cta">Find a Place</a>
        </nav>
      </header>

      {/* LIGHTBOX */}
      {lightboxOpen && (
        <PhotoLightbox
          photos={gallery}
          index={activePhoto}
          onIndexChange={setActivePhoto}
          onClose={() => setLightboxOpen(false)}
          alt={building.name}
        />
      )}

      {/* HERO */}
      <section className="bd-hero">
        <div className="bd-hero-inner">
          <a href="/search" className="bd-back">← Back to search</a>

          <div className="bd-hero-content">
            <div className="bd-hero-left">
              {building.tag && <div className="bd-hero-tag">{building.tag}</div>}
              <h1 className="bd-hero-title">{building.publicName || building.name}</h1>
              {/* Exact civic address intentionally not shown — the h1 carries the
                  street name and the meta line below carries neighbourhood + city. */}
              <div className="bd-hero-meta">
                <span>{building.city}, {building.region}</span>
                {building.neighbourhood && <><span>·</span><span>{building.neighbourhood}</span></>}
                {bedsLabel && <><span>·</span><span>{bedsLabel}</span></>}
                {building.isFurnished && <><span>·</span><span>Furnished available</span></>}
              </div>
            </div>

            {/* Price and CTA live above the fold. Price is the most-scanned
                element on a listing and previously required scrolling past the
                whole gallery to find. */}
            <div className="bd-hero-right">
              {building.startingPrice > 0 ? (
                <div className="bd-hero-price">
                  <span className="bd-hero-price-label">From</span>
                  <span className="bd-hero-price-val">
                    ${Number(building.startingPrice).toLocaleString()}
                    <small>/mo</small>
                  </span>
                </div>
              ) : (
                <div className="bd-hero-price">
                  <span className="bd-hero-price-val bd-hero-price-none">Contact us for pricing</span>
                </div>
              )}
              <FavouriteButton id={building.id} className="bd-hero-fav" />
              <a href="#book" className="bd-hero-cta">Book a visit</a>
            </div>
          </div>
        </div>
      </section>

      {/* PHOTO MOSAIC — Airbnb style: one large photo, four smaller alongside.
          Falls back gracefully when a building has fewer than five photos. */}
      {hasRealGallery && (
        <div className="bd-mosaic-wrap">
          <div className={`bd-mosaic bd-mosaic-${Math.min(gallery.length, 5)}`}>
            <button className="bd-mosaic-hero" onClick={() => openLightbox(0)} aria-label="View photo 1">
              <img src={gallery[0]} alt={building.publicName || building.name} />
            </button>

            {gallery.length > 1 && (
              <div className="bd-mosaic-grid">
                {gallery.slice(1, 5).map((url, i) => (
                  <button key={i} className="bd-mosaic-cell" onClick={() => openLightbox(i + 1)} aria-label={`View photo ${i + 2}`}>
                    <img src={url} alt="" />
                  </button>
                ))}
              </div>
            )}

            {gallery.length > 1 && (
              <button className="bd-mosaic-all" onClick={() => openLightbox(0)}>
                <span className="bd-mosaic-all-icon" aria-hidden="true">
                  <i /><i /><i /><i /><i /><i /><i /><i /><i />
                </span>
                Show all {gallery.length} photos
              </button>
            )}
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <section className="bd-main">
        <div className="bd-main-inner">
          {/* LEFT — building info */}
          <div className="bd-left">
            {/* KEY FACTS */}
            <div className="bd-facts">
              {building.neighbourhood && (
                <div className="bd-fact">
                  <div className="bd-fact-label">Neighbourhood</div>
                  <div className="bd-fact-value">{building.neighbourhood}</div>
                </div>
              )}
              <div className="bd-fact">
                <div className="bd-fact-label">Status</div>
                <div className="bd-fact-value bd-fact-status">{building.statusText === "Lease-Up" ? "Now leasing" : "Available"}</div>
              </div>
            </div>

            <div className="bd-verified">
              <Bolt />
              <div>
                <strong>RentBolt Verified</strong>
                <span>Our agents have personally visited this building and can arrange a tour.</span>
              </div>
            </div>

            {/* PRICING — compact grid */}
            {building.unitPrices?.filter(u => u.price).length > 0 && (
              <div className="bd-section">
                <h2>💰 Pricing</h2>
                <div className="bd-price-grid">
                  {building.unitPrices.filter(u => u.price).map((u, i) => (
                    <div key={i} className="bd-price-card">
                      <div className="bd-price-card-type">{u.type}</div>
                      <div className="bd-price-card-from">From</div>
                      <div className="bd-price-card-val">${u.price.toLocaleString()}</div>
                      <div className="bd-price-card-mo">/ month</div>
                    </div>
                  ))}
                </div>
                {building.unitPrices.some(u => !u.price) && (
                  <p className="bd-price-note">Some unit types available — contact us for pricing</p>
                )}
              </div>
            )}

            {/* DESCRIPTION */}
            {building.description && building.description.trim() && (
              <div className="bd-section">
                <h2>📋 About this building</h2>
                <div className="bd-prose">
                  {building.description.split("\n").filter(Boolean).map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            )}

            {/* AMENITIES — structured pills (Toronto) or legacy list */}
            {(building.amenitiesList?.length > 0 || building.amenities?.length > 0) && (
              <div className="bd-section">
                <h2>🏢 Amenities</h2>
                <div className="bd-pills">
                  {(building.amenitiesList?.length > 0 ? building.amenitiesList : building.amenities).map((a, i) => {
                    const icon = getIcon(a, AMENITY_ICONS);
                    return <span key={i} className="bd-pill bd-pill-amenity">{icon && <span className="bd-pill-emoji">{icon}</span>}{a}</span>;
                  })}
                </div>
              </div>
            )}

            {/* APPLIANCES — Toronto only */}
            {building.appliancesList?.length > 0 && (
              <div className="bd-section">
                <h2>🔌 Appliances</h2>
                <div className="bd-pills">
                  {building.appliancesList.map((a, i) => {
                    const icon = getIcon(a, APPLIANCE_ICONS);
                    return <span key={i} className="bd-pill bd-pill-blue">{icon && <span className="bd-pill-emoji">{icon}</span>}{a}</span>;
                  })}
                </div>
              </div>
            )}

            {/* INCLUSIONS — Toronto structured or legacy */}
            <div className="bd-section">
              <h2>✅ What's included</h2>
              {building.inclusionsList?.length > 0 ? (
                <div className="bd-pills">
                  {building.inclusionsList.map((inc, i) => {
                    const icon = getIcon(inc, INCLUSION_ICONS);
                    return <span key={i} className="bd-pill bd-pill-gold">{icon && <span className="bd-pill-emoji">{icon}</span>}{inc}</span>;
                  })}
                </div>
              ) : (
                <div className="bd-pills">
                  {inclusions.map((inc, i) => {
                    const icon = getIcon(inc, INCLUSION_ICONS);
                    return <span key={i} className="bd-pill bd-pill-gold">{icon && <span className="bd-pill-emoji">{icon}</span>}{inc}</span>;
                  })}
                  {inclusions.length === 0 && (
                    <span style={{color:"var(--text-mute)",fontSize:14}}>
                      {/* An explicit "No Inclusions" beats "Not specified": a renter
                          who reads "not specified" phones to ask. */}
                      {building.noInclusions ? "Nothing included — utilities are extra" : "Not specified"}
                    </span>
                  )}
                </div>
              )}
              {(building.parking || building.pets || building.isFurnished) && (
                <div className="bd-incl-grid" style={{marginTop:16}}>
                  {building.parking && (
                    <div className="bd-incl">
                      <div className="bd-incl-label">Parking</div>
                      <div className="bd-incl-value">{building.parking}</div>
                    </div>
                  )}
                  {building.pets && (
                    <div className="bd-incl">
                      <div className="bd-incl-label">Pets</div>
                      <div className="bd-incl-value">{building.pets}</div>
                    </div>
                  )}
                  {building.isFurnished && (
                    <div className="bd-incl">
                      <div className="bd-incl-label">Furnishing</div>
                      <div className="bd-incl-value">Furnished units available</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — sticky lead form */}
          <aside className="bd-right" id="book">
            <div className="bd-form-card">
              {!submitted ? (
                <>
                  <div className="bd-form-tag">Book a visit</div>
                  <h3>Interested in this property?</h3>
                  <p className="bd-form-sub">A RentBolt agent will reach out within 24 hours to arrange a tour.</p>

                  <form onSubmit={handleSubmit} className="bd-form">
                    <div className="bd-field">
                      <label>Full name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={e => setForm({...form, name: e.target.value})}
                        placeholder="John Smith"
                        required
                      />
                    </div>
                    <div className="bd-field">
                      <label>Email *</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm({...form, email: e.target.value})}
                        placeholder="you@example.com"
                        required
                      />
                    </div>
                    <div className="bd-field">
                      <label>Phone (optional)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm({...form, phone: e.target.value})}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div className="bd-field">
                      <label>Visit type</label>
                      <div className="bd-radio-group">
                        <label className={`bd-radio${form.visitType === "in-person" ? " active" : ""}`}>
                          <input
                            type="radio"
                            name="visitType"
                            value="in-person"
                            checked={form.visitType === "in-person"}
                            onChange={e => setForm({...form, visitType: e.target.value})}
                          />
                          <span>In-person</span>
                        </label>
                        <label className={`bd-radio${form.visitType === "virtual" ? " active" : ""}`}>
                          <input
                            type="radio"
                            name="visitType"
                            value="virtual"
                            checked={form.visitType === "virtual"}
                            onChange={e => setForm({...form, visitType: e.target.value})}
                          />
                          <span>Virtual</span>
                        </label>
                      </div>
                    </div>
                    <div className="bd-field">
                      <label>Move-in date (optional)</label>
                      <input
                        type="date"
                        value={form.moveIn}
                        onChange={e => setForm({...form, moveIn: e.target.value})}
                      />
                    </div>
                    <div className="bd-field">
                      <label>Anything we should know? (optional)</label>
                      <textarea
                        rows="3"
                        value={form.message}
                        onChange={e => setForm({...form, message: e.target.value})}
                        placeholder="Budget, must-haves, timing..."
                      />
                    </div>

                    {error && <div className="bd-form-error">{error}</div>}

                    <button type="submit" className="bd-form-btn" disabled={submitting}>
                      {submitting ? "Sending..." : "Book a visit →"}
                    </button>
                    <p className="bd-form-disclaim">
                      Free. No commitment. We'll reach out within 24 hours.
                    </p>
                  </form>
                </>
              ) : (
                <div className="bd-form-success">
                  <div className="bd-success-icon">✓</div>
                  <h3>Request received</h3>
                  <p>A RentBolt agent will reach out shortly to arrange your visit.</p>
                  <a href="/search" className="bd-form-btn-out">Browse more buildings →</a>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bd-footer">
        <div className="bd-footer-inner">
          <div className="bd-footer-brand">
            <a href="/" className="bd-logo">
              <Bolt />
              RentBolt
            </a>
            <p>Premium multi-residential leasing across Canada. Licensed brokerage in Quebec & Ontario.</p>
          </div>
          <div className="bd-footer-links">
            <a href="/">Home</a>
            <a href="/search">Search</a>
            <a href="/landlords">Property Owners</a>
            <a href="mailto:hello@rentbolt.ca">hello@rentbolt.ca</a>
            <a href="tel:+14387937514">(438) 793-7514</a>
          </div>
        </div>
        <div className="bd-footer-legal">© 2026 RentBolt · All rights reserved</div>
      </footer>

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

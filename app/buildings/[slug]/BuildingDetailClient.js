"use client";

import { useEffect, useState } from "react";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import FindAPlaceModal from "@/components/FindAPlaceModal";

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
    // Placeholder: in the future, POST to /api/leads which writes to Monday
    await new Promise(r => setTimeout(r, 800));
    setSubmitted(true);
    setSubmitting(false);
  };

  const heroPhoto = getBuildingPhoto(building);
  const gallery = building.photoGallery?.length > 0 ? building.photoGallery : [heroPhoto];
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
          <a href="/landlords">Partnership</a>
          <a href="/find-a-place" className="bd-nav-cta">Find a Place</a>
        </nav>
      </header>

      {/* PHOTO GALLERY — single full-width banner, click to expand into lightbox */}
      {hasRealGallery && (
        <div className="bd-mosaic-wrap">
          <a href="/search" className="bd-mosaic-back">← Back to search</a>
          <button
            className="bd-gallery-main-photo"
            onClick={() => setLightboxOpen(true)}
            aria-label="View all photos"
          >
            <img src={gallery[0]} alt={building.name} />
            {gallery.length > 1 && (
              <span className="bd-gallery-count">📷 {gallery.length} photos</span>
            )}
          </button>
        </div>
      )}

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
      <section className="bd-hero" style={hasRealGallery ? {} : { backgroundImage: `url(${heroPhoto})` }}>
        <div className="bd-hero-inner">
          {!hasRealGallery && <a href="/search" className="bd-back">← Back to search</a>}

          <div className="bd-hero-content">
            <div className="bd-hero-left">
              {building.tag && <div className="bd-hero-tag">{building.tag}</div>}
              <h1 className="bd-hero-title">{building.publicName || building.name}</h1>
              {/* Exact civic address intentionally not shown — the h1 carries the
                  street name and the meta line below carries neighbourhood + city. */}
              <div className="bd-hero-meta">
                <span>{building.city}, {building.region}</span>
                {building.area && <><span>·</span><span>{building.area}</span></>}
                {bedsLabel && <><span>·</span><span>{bedsLabel}</span></>}
                {building.isFurnished && <><span>·</span><span>Furnished available</span></>}
              </div>
            </div>
            <div className="bd-hero-right">
              <div className="bd-verified">
                <Bolt />
                <div>
                  <strong>RentBolt Verified</strong>
                  <span>Our agents have personally visited this building and can arrange a tour.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="bd-main">
        <div className="bd-main-inner">
          {/* LEFT — building info */}
          <div className="bd-left">
            {/* KEY FACTS */}
            <div className="bd-facts">
              {building.area && (
                <div className="bd-fact">
                  <div className="bd-fact-label">Neighbourhood</div>
                  <div className="bd-fact-value">{building.area}</div>
                </div>
              )}
              <div className="bd-fact">
                <div className="bd-fact-label">Status</div>
                <div className="bd-fact-value bd-fact-status">{building.statusText === "Lease-Up" ? "Now leasing" : "Available"}</div>
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
                  {inclusions.length === 0 && <span style={{color:"var(--text-mute)",fontSize:14}}>Not specified</span>}
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
          <aside className="bd-right">
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
            <a href="/landlords">Partnership</a>
            <a href="mailto:hello@rentbolt.ca">hello@rentbolt.ca</a>
            <a href="tel:+14387937514">(438) 793-7514</a>
          </div>
        </div>
        <div className="bd-footer-legal">© 2026 RentBolt · All rights reserved</div>
      </footer>

      <style jsx global>{`
        body { background: var(--white); }

        .bd-header {
          position: sticky;
          top: 0;
          z-index: 100;
          padding: 16px 32px;
          background: rgba(255,255,255,0.96);
          backdrop-filter: blur(16px);
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bd-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          color: var(--navy);
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .bd-nav {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .bd-nav a {
          color: var(--text);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 10px 18px;
          border-radius: 100px;
          transition: background 0.2s;
        }
        .bd-nav a:hover { background: var(--bg-soft); }
        .bd-nav-cta {
          background: var(--gold);
          color: var(--navy) !important;
          font-weight: 700 !important;
          padding: 10px 22px !important;
          border: none !important;
          border-radius: 8px !important;
          font-size: inherit !important;
          font-family: inherit !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        .bd-nav-cta:hover { background: var(--gold-bright) !important; }

        .bd-mosaic-wrap {
          max-width: 1100px;
          margin: 0 auto;
          padding: 16px 16px 0;
        }
        .bd-mosaic-back {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-mute);
          text-decoration: none;
          margin-bottom: 12px;
        }
        .bd-mosaic-back:hover { color: var(--navy); }
        .bd-gallery-main-photo {
          width: 100%;
          height: 480px;
          border-radius: 14px;
          overflow: hidden;
          background: var(--bg-soft);
          position: relative;
          border: none;
          padding: 0;
          cursor: pointer;
          display: block;
        }
        .bd-gallery-main-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.25s;
        }
        .bd-gallery-main-photo:hover img {
          transform: scale(1.015);
        }
        .bd-gallery-count {
          position: absolute;
          bottom: 16px;
          right: 16px;
          background: rgba(0,0,0,0.6);
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          padding: 8px 16px;
          border-radius: 8px;
          backdrop-filter: blur(4px);
        }
        @media (max-width: 768px) {
          .bd-mosaic-wrap { padding: 12px 12px 0; }
          .bd-gallery-main-photo { height: 260px; border-radius: 12px; }
        }

        .bd-lightbox {
          position: fixed;
          inset: 0;
          z-index: 500;
          background: rgba(4,14,42,0.97);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: zoom-out;
        }
        .bd-lightbox-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          font-size: 18px;
          cursor: pointer;
          z-index: 2;
        }
        .bd-lightbox-close:hover { background: rgba(255,255,255,0.2); }
        .bd-lightbox-count {
          position: absolute;
          top: 28px;
          left: 24px;
          color: rgba(255,255,255,0.7);
          font-size: 13px;
          font-weight: 600;
        }
        .bd-lightbox-img {
          max-width: 88vw;
          max-height: 78vh;
          object-fit: contain;
          border-radius: 8px;
          cursor: default;
        }
        .bd-lightbox-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.1);
          border: none;
          color: #fff;
          width: 48px;
          height: 48px;
          border-radius: 50%;
          font-size: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 1;
        }
        .bd-lightbox-nav:hover { background: rgba(255,255,255,0.2); }
        .bd-lightbox-prev { left: 16px; }
        .bd-lightbox-next { right: 16px; }
        .bd-lightbox-thumbs {
          position: absolute;
          bottom: 20px;
          left: 0; right: 0;
          display: flex;
          justify-content: center;
          gap: 8px;
          padding: 0 16px;
          overflow-x: auto;
        }
        .bd-lightbox-thumb {
          width: 56px;
          height: 40px;
          border-radius: 6px;
          overflow: hidden;
          border: 2px solid transparent;
          padding: 0;
          cursor: pointer;
          opacity: 0.5;
          flex-shrink: 0;
        }
        .bd-lightbox-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .bd-lightbox-thumb.active {
          opacity: 1;
          border-color: var(--gold);
        }
        @media (max-width: 768px) {
          .bd-lightbox-img { max-width: 94vw; max-height: 68vh; }
          .bd-lightbox-nav { width: 40px; height: 40px; font-size: 22px; }
          .bd-lightbox-thumbs { display: none; }
        }

        .bd-hero {
          background-color: var(--navy-deep);
          background-size: cover;
          background-position: center;
          color: white;
          padding: 32px 32px 48px;
          position: relative;
          overflow: hidden;
        }
        .bd-hero::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(4,14,42,0.88) 0%, rgba(10,31,92,0.80) 50%, rgba(10,31,92,0.65) 100%);
          pointer-events: none;
          z-index: 0;
        }
        .bd-hero-inner {
          max-width: 1320px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .bd-back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.7);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 32px;
          transition: color 0.2s;
        }
        .bd-back:hover { color: var(--gold-bright); }
        .bd-hero-content {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 60px;
          align-items: end;
        }
        .bd-hero-tag {
          display: inline-block;
          background: rgba(201,168,76,0.15);
          border: 1px solid rgba(201,168,76,0.3);
          color: var(--gold-bright);
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .bd-hero-title {
          font-size: clamp(36px, 5vw, 64px);
          font-weight: 800;
          letter-spacing: -0.03em;
          line-height: 1.04;
          margin-bottom: 16px;
        }
        .bd-hero-addr {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.85);
          font-size: 16px;
          margin-bottom: 14px;
        }
        .bd-hero-meta {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          color: rgba(255,255,255,0.65);
          font-size: 14px;
          font-weight: 500;
        }
        .bd-hero-meta span { white-space: nowrap; }

        .bd-verified {
          display: flex;
          gap: 16px;
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px 22px;
          align-items: flex-start;
        }
        .bd-verified > svg { flex-shrink: 0; margin-top: 2px; }
        .bd-verified strong {
          display: block;
          color: var(--gold-bright);
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          margin-bottom: 6px;
        }
        .bd-verified span {
          color: rgba(255,255,255,0.75);
          font-size: 13px;
          line-height: 1.5;
        }

        .bd-main {
          padding: 64px 32px 100px;
          background: var(--white);
        }
        .bd-main-inner {
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 64px;
          align-items: start;
        }

        .bd-left { min-width: 0; }
        .bd-facts {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 4px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          padding: 4px;
          margin-bottom: 48px;
        }
        .bd-fact {
          padding: 20px 24px;
          background: white;
          border-radius: 12px;
        }
        .bd-fact-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .bd-fact-value {
          font-size: 16px;
          font-weight: 700;
          color: var(--navy);
          letter-spacing: -0.01em;
        }

        .bd-fact-status { color: #16a34a !important; }

        .bd-price-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 12px;
        }
        .bd-price-card {
          background: var(--bg-soft);
          border: 1.5px solid var(--border);
          border-radius: 14px;
          padding: 16px;
          text-align: center;
          transition: all 0.15s;
        }
        .bd-price-card:hover {
          border-color: var(--navy);
          background: #fff;
          box-shadow: 0 4px 12px rgba(10,31,92,0.08);
        }
        .bd-price-card-type {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin-bottom: 8px;
        }
        .bd-price-card-from {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold-dark, var(--gold));
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 2px;
        }
        .bd-price-card-val {
          font-size: 22px;
          font-weight: 800;
          color: var(--navy);
          letter-spacing: -0.03em;
          line-height: 1;
        }
        .bd-price-card-mo {
          font-size: 11px;
          color: var(--text-mute);
          margin-top: 4px;
          font-weight: 500;
        }
        .bd-price-note {
          font-size: 13px;
          color: var(--text-mute);
          margin-top: 12px;
          font-style: italic;
        }

        .bd-section {
          margin-bottom: 48px;
        }
        .bd-section h2 {
          font-size: 24px;
          font-weight: 800;
          letter-spacing: -0.02em;
          color: var(--navy);
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .bd-section h2::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .bd-prose p {
          font-size: 15px;
          color: var(--text);
          line-height: 1.75;
          margin-bottom: 14px;
        }
        .bd-prose p:last-child { margin-bottom: 0; }


        .bd-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .bd-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 600;
          background: #F7F8FA;
          color: var(--navy);
          border: 1.5px solid #E2E5EC;
          transition: all 0.15s;
          line-height: 1;
        }
        .bd-pill:hover {
          border-color: var(--navy);
          background: #fff;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(10,31,92,0.08);
        }
        .bd-pill-emoji {
          font-size: 16px;
          line-height: 1;
        }
        .bd-pill-amenity {
          background: #F0F4FF;
          border-color: #C8D4F0;
          color: var(--navy);
        }
        .bd-pill-gold {
          background: rgba(201,168,76,0.08);
          border-color: rgba(201,168,76,0.3);
          color: #6B4F10;
        }
        .bd-pill-blue {
          background: #F5F7FF;
          border-color: #D0D8F0;
          color: var(--navy);
        }
        .bd-tags {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 0;
        }
        .bd-tags li {
          padding: 8px 16px;
          background: var(--gold-soft);
          color: var(--navy);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
        }

        .bd-incl-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .bd-incl {
          padding: 20px;
          background: var(--bg);
          border-radius: 12px;
          border: 1px solid var(--border);
        }
        .bd-incl-label {
          font-size: 11px;
          font-weight: 700;
          color: var(--text-mute);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-bottom: 6px;
        }
        .bd-incl-value {
          font-size: 14px;
          font-weight: 600;
          color: var(--navy);
          line-height: 1.4;
        }

        .bd-right { position: sticky; top: 96px; }
        .bd-form-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 8px 24px rgba(10,31,92,0.06);
        }
        .bd-form-tag {
          display: inline-block;
          background: var(--gold-soft);
          color: var(--navy);
          padding: 5px 12px;
          border-radius: 100px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }
        .bd-form-card h3 {
          font-size: 22px;
          font-weight: 800;
          color: var(--navy);
          letter-spacing: -0.02em;
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .bd-form-sub {
          font-size: 14px;
          color: var(--text-mute);
          line-height: 1.5;
          margin-bottom: 22px;
        }
        .bd-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .bd-field { display: flex; flex-direction: column; gap: 6px; }
        .bd-field label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-mute);
          letter-spacing: 0.02em;
        }
        .bd-field input, .bd-field textarea {
          padding: 12px 14px;
          border: 1px solid var(--border);
          border-radius: 10px;
          font-size: 14px;
          font-family: inherit;
          color: var(--text);
          background: white;
          transition: border-color 0.2s;
          outline: none;
        }
        .bd-field input:focus, .bd-field textarea:focus { border-color: var(--gold); }
        .bd-field textarea { resize: vertical; min-height: 80px; }

        .bd-radio-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .bd-radio {
          position: relative;
          padding: 12px;
          border: 1px solid var(--border);
          border-radius: 10px;
          cursor: pointer;
          text-align: center;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-mute);
          transition: all 0.2s;
        }
        .bd-radio input { display: none; }
        .bd-radio:hover { border-color: var(--text-mute); }
        .bd-radio.active {
          border-color: var(--gold);
          background: var(--gold-soft);
          color: var(--navy);
        }
        .bd-form-error {
          padding: 10px 14px;
          background: #fef2f2;
          color: #b91c1c;
          border-radius: 10px;
          font-size: 13px;
        }
        .bd-form-btn {
          padding: 14px 24px;
          background: var(--navy);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          margin-top: 4px;
        }
        .bd-form-btn:hover:not(:disabled) {
          background: var(--gold);
          color: var(--navy);
          transform: translateY(-1px);
        }
        .bd-form-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .bd-form-disclaim {
          font-size: 12px;
          color: var(--text-mute);
          text-align: center;
          margin-top: 4px;
        }

        .bd-form-success {
          text-align: center;
          padding: 20px 8px;
        }
        .bd-success-icon {
          width: 56px; height: 56px;
          margin: 0 auto 18px;
          background: var(--gold-soft);
          color: var(--gold);
          border-radius: 50%;
          font-size: 30px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bd-form-success h3 {
          font-size: 22px;
          font-weight: 800;
          color: var(--navy);
          margin-bottom: 10px;
        }
        .bd-form-success p {
          font-size: 14px;
          color: var(--text-mute);
          line-height: 1.6;
          margin-bottom: 22px;
        }
        .bd-form-btn-out {
          display: inline-block;
          padding: 12px 22px;
          border: 1px solid var(--navy);
          color: var(--navy);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.2s;
        }
        .bd-form-btn-out:hover {
          background: var(--navy);
          color: white;
        }

        .bd-footer {
          background: var(--navy-deep);
          color: rgba(255,255,255,0.75);
          padding: 64px 32px 28px;
        }
        .bd-footer-inner {
          max-width: 1320px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 60px;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .bd-footer-brand .bd-logo { color: white; margin-bottom: 16px; }
        .bd-footer-brand p {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          max-width: 360px;
        }
        .bd-footer-links {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .bd-footer-links a {
          color: rgba(255,255,255,0.7);
          font-size: 14px;
          text-decoration: none;
          transition: color 0.2s;
        }
        .bd-footer-links a:hover { color: var(--gold-bright); }
        .bd-footer-legal {
          max-width: 1320px;
          margin: 24px auto 0;
          font-size: 12px;
          color: rgba(255,255,255,0.4);
        }

        @media (max-width: 968px) {
          .bd-header { padding: 14px 16px; }
          .bd-nav a:not(.bd-nav-cta) { display: none; }
          .bd-nav { display: none; }
          .bd-hamburger { display: flex; background: none; border: none; cursor: pointer; padding: 6px; color: var(--navy); }
        }

        @media (max-width: 768px) {
          .bd-hero { padding: 24px 16px 40px; }
          .bd-hero-content { grid-template-columns: 1fr; gap: 32px; }
          .bd-main { padding: 40px 16px 60px; }
          .bd-main-inner { grid-template-columns: 1fr; gap: 32px; }
          .bd-right { position: relative; top: 0; }
          .bd-footer { padding: 48px 16px 24px; }
          .bd-footer-inner { grid-template-columns: 1fr; gap: 32px; }
        }
      `}</style>

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import SavedNavLink from "@/app/components/SavedNavLink";
import { getBuildingPhoto, CITY_PHOTOS as CITY_PHOTO_MAP } from "@/lib/cityPhotos";
import FindAPlaceModal from "@/components/FindAPlaceModal";

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="url(#bolt-grad)" stroke="url(#bolt-grad)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="bolt-grad" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Line icons, consistent 1.6 stroke. Emoji were rendering differently per OS
// and read as placeholders rather than designed iconography.
const ICONS = {
  search: <path d="M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35" />,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>,
  doc: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" /><path d="M9 15h6" /></>,
  key: <><circle cx="7.5" cy="15.5" r="4.5" /><path d="M10.7 12.3 21 2" /><path d="m17 6 3 3" /></>,
};

function StepIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {ICONS[name]}
    </svg>
  );
}

const STEPS = [
  { icon: "search", detail: "Unlike a traditional listing platform, RentBolt visits and onboards every property in person. Every listing is vetted and verified before you see it.", title: "Find your fit", desc: "Search by city through thousands of partner apartments for what matters most to you." },
  { icon: "eye", detail: "Local rental experts join RentBolt to help you find your next place to call home. We personally vet, onboard and certify each advisor, so you have someone you can count on from start to finish.", title: "Visit", desc: "Get a tour from a real local expert who knows the market." },
  { icon: "doc", detail: "Online applications, done better. Before submitting your file, we help you understand your chances of approval and strengthen your application for the property you want.", title: "Apply", desc: "Apply in minutes from anywhere. Quick background check, fast decision." },
  { icon: "key", detail: "You’re all set! Your property manager takes it from here, but we’re still here if there’s anything we can help you with.", title: "Move in", desc: "Sign your lease, get your keys, settle into your new home." },
];

const CITY_FILTERS = ["All cities", "Montreal", "Toronto", "Ottawa", "London", "Kitchener-Waterloo"];

// City photos now in lib/cityPhotos.js

function formatBeds(beds) {
  if (!beds || beds.length === 0) return "";
  const types = beds.map(b => b === 0 ? "Studio" : `${b} Bed`);
  return types.join(" · ");
}

export default function HomeClient({ buildings = [], cities = [] }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeCity, setActiveCity] = useState("All cities");
  const [modalOpen, setModalOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [openStep, setOpenStep] = useState(null);
  // Brand hero image. Deliberately a styled lifestyle shot rather than a real
  // listing — it sets the tone, it is not presented as a specific unit.
  const heroPhotos = ["/hero-apartment.jpg"];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);

    const obs = new IntersectionObserver(
      (entries) => entries.forEach(e => e.isIntersecting && e.target.classList.add("visible")),
      { threshold: 0.1 }
    );
    document.querySelectorAll(".rb-reveal").forEach(el => obs.observe(el));

    return () => { window.removeEventListener("scroll", onScroll); obs.disconnect(); };
  }, []);

  const displayBuildings = activeCity === "All cities"
    ? buildings.slice(0, 12)
    : buildings.filter(b => b.city === activeCity).slice(0, 12);

  // City listing counts
  const cityCounts = buildings.reduce((acc, b) => {
    acc[b.city] = (acc[b.city] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      {/* HEADER */}
      <header className={`rb-header${scrolled ? " scrolled" : ""}`}>
        <a href="/" className="rb-logo">
          <Bolt />
          RentBolt
        </a>
        <nav className="rb-nav">
          <a href="#properties">Properties</a>
          <a href="#how">How it works</a>
          <a href="/landlords">Property Owners</a>
            <SavedNavLink />
          <a href="/contact">Contact</a>
          <a href="/find-a-place" className="rb-nav-cta">Start Search</a>
        </nav>
        {/* Hamburger */}
        <button className="rb-hamburger" onClick={() => setMobileMenu(m => !m)} aria-label="Menu">
          <span className={`rb-ham-icon${mobileMenu ? " open" : ""}`}>
            <span/><span/><span/>
          </span>
        </button>
      </header>
      {/* Mobile drawer */}
      {mobileMenu && (
        <div className="rb-mobile-drawer">
          <a href="#properties" onClick={() => setMobileMenu(false)}>Properties</a>
          <a href="#how" onClick={() => setMobileMenu(false)}>How it works</a>
          <a href="/landlords" onClick={() => setMobileMenu(false)}>Property Owners</a>
          <a href="/contact" onClick={() => setMobileMenu(false)}>Contact</a>
          <a href="/find-a-place" className="rb-mobile-cta">Start Search →</a>
        </div>
      )}

      {/* HERO */}
      <section className={`rb-hero${heroPhotos.length ? " rb-hero-split" : ""}`}>
        <div className="rb-hero-container">
          <div className="rb-hero-badge">
            <span className="dot"></span>
            9,000+ apartments across Canada
          </div>
          <h1>Find a place &amp;<br/><span className="accent">call it yours.</span></h1>
          <p className="rb-hero-desc">
            Thousands of apartments, rooms and homes for rent. Find what you&apos;re
            looking for, with real human experts guiding you every step.
          </p>

          <form className="rb-search" onSubmit={(e) => {
            e.preventDefault();
            const city = e.target.city.value;
            window.location.href = city ? `/search?city=${encodeURIComponent(city)}` : "/search";
          }}>
            <div className="rb-search-field">
              <label>City</label>
              <select name="city">
                <option value="">All cities</option>
                <option value="Montreal">Montreal</option>
                <option value="Toronto">Toronto</option>
                <option value="Ottawa">Ottawa</option>
                <option value="London">London</option>
                <option value="Kitchener-Waterloo">Kitchener-Waterloo</option>
                <option value="Hamilton">Hamilton</option>
                <option value="Gatineau">Gatineau</option>
              </select>
            </div>
            <button className="rb-search-btn" type="submit">Start search</button>
          </form>
          <p style={{marginTop: "16px", fontSize: "14px", color: "rgba(255,255,255,0.55)"}}>
            Not sure where yet?{" "}
            <a href="/find-a-place" style={{color: "rgba(255,255,255,0.85)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px"}}>
              Tell us what you're looking for →
            </a>
          </p>

        </div>

        {/* Photo panel. Desktop only — mobile keeps the original single-column
            hero, since the empty right side was a desktop-only problem. */}
        {heroPhotos.length > 0 && (
          <div className="rb-hero-photo" aria-hidden="true">
            <img src={heroPhotos[0]} alt="" className="on" />
          </div>
        )}
      </section>

      {/* KEY FIGURES — moved out of the hero so the navy block stays compact */}
      <div className="rb-figures">
        <div className="rb-figures-inner">
          <div className="rb-figure">
            <div className="num">9,000+</div>
            <div className="label">Active listings</div>
          </div>
          <div className="rb-figure">
            <div className="num">5</div>
            <div className="label">Major cities</div>
          </div>
          <div className="rb-figure">
            <div className="num">80+</div>
            <div className="label">Leasing advisors</div>
          </div>
          <div className="rb-figure">
            <div className="num">4.8 ⭐</div>
            <div className="label">Google reviews</div>
          </div>
        </div>
      </div>

      {/* TRUST — what we actually do, rather than press mentions */}
      <div className="rb-trust">
        <div className="rb-trust-inner">
          <div className="rb-tpoint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            <span>Real local leasing advisors</span>
          </div>
          <div className="rb-tpoint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="m9 12.5 2 2 4-4"/>
            </svg>
            <span>Professionally vetted listings</span>
          </div>
          <div className="rb-tpoint">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/>
              <path d="M8 13h8"/><path d="M8 17h5"/>
            </svg>
            <span>From inquiry to moving day</span>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="rb-section rb-how rb-reveal" id="how">
        <div className="rb-container">
          <div className="rb-shead">
            <span className="rb-tag">🏡 The RentBolt Way</span>
            <h2>A better way to <span className="accent">rent.</span></h2>
          </div>
          <div className="rb-steps">
            {STEPS.map((step, i) => (
              <button
                key={i}
                type="button"
                className={`rb-step${openStep === i ? " open" : ""}`}
                onClick={() => setOpenStep(openStep === i ? null : i)}
                aria-expanded={openStep === i}
              >
                <span className="rb-step-face">
                  <span className="rb-step-icon"><StepIcon name={step.icon} /></span>
                  <h3>{step.title}</h3>
                  <p>{step.desc}</p>
                  <span className="rb-step-more">Learn more <span aria-hidden="true">+</span></span>
                </span>
                <span className="rb-step-panel">
                  <span className="rb-step-detail">{step.detail}</span>
                  <span className="rb-step-close" aria-hidden="true">Close &times;</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* PROPERTIES */}
      <section className="rb-section rb-reveal" id="properties">
        <div className="rb-container">
          <div className="rb-shead">
            <span className="rb-tag">🔥 Latest Properties</span>
            <h2>Latest gems <span className="accent">for rent.</span></h2>
            <p>Places that you can visit in the next 24 hours.</p>
          </div>

          <div className="rb-pills">
            {CITY_FILTERS.map(c => (
              <button
                key={c}
                className={`rb-pill${activeCity === c ? " active" : ""}`}
                onClick={() => setActiveCity(c)}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="rb-grid">
            {displayBuildings.length === 0 ? (
              <p style={{ color: "var(--text-mute)", gridColumn: "1 / -1", textAlign: "center", padding: "60px 0" }}>
                Loading buildings...
              </p>
            ) : (
              displayBuildings.map(b => {
                const imgSrc = getBuildingPhoto(b) || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&q=80';
                const locDisplay = b.area ? `${b.area} · ${b.city}` : `${b.city}, ${b.region}`;
                return (
                  <a key={b.id} href={`/buildings/${b.slug}`} className="rb-pcard" target="_blank" rel="noopener noreferrer">
                    <div className="rb-pimg">
                      {b.tag && <div className="rb-ptag">{b.tag}</div>}
                      <img
                        src={imgSrc}
                        alt={b.name}
                        onError={(e) => { e.currentTarget.src = CITY_PHOTO_MAP[b.city] || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&q=80"; }}
                      />
                    </div>
                    <div className="rb-pbody">
                      <div className="rb-ploc">{locDisplay}</div>
                      <h3>{b.publicName || b.name}</h3>
                      <div className="rb-pspecs">
                        {b.bedrooms && b.bedrooms.length > 0 && <span>{formatBeds(b.bedrooms)}</span>}
                        {b.isFurnished && <span>Furnished</span>}
                      </div>
                      <div className="rb-pfoot">
                        <div className="rb-pprice">
                          {b.startingPrice > 0 ? <>From ${Number(b.startingPrice).toLocaleString()}<small>/mo</small></> : <>Contact for pricing</>}
                        </div>
                        <div className="rb-parrow">→</div>
                      </div>
                    </div>
                  </a>
                );
              })
            )}
          </div>

          {buildings.length > 6 && (
            <div className="rb-view-all">
              <a href="/search" className="rb-btn-out">View all {buildings.length.toLocaleString()}+ properties →</a>
            </div>
          )}
        </div>
      </section>

      {/* CITIES */}
      <section className="rb-section rb-cities rb-reveal" id="cities">
        <div className="rb-container">
          <div className="rb-shead center">
            <span className="rb-tag">🇨🇦 Pick your market</span>
            <h2>Browse by <span className="accent">city.</span></h2>
            <p>Thousands of verified listings across major Canadian markets.</p>
          </div>
          <div className="rb-cgrid">
            {["Montreal", "Ottawa", "Toronto", "London", "Kitchener-Waterloo"].map(city => (
              <a key={city} href="/search" className="rb-city">
                <img src={CITY_PHOTO_MAP[city] || CITY_PHOTO_MAP["Montreal"]} alt={city} />
                <div className="rb-ccontent">
                  <h3>{city === "Montreal" ? "Montréal" : city}</h3>
                  <p>{cityCounts[city] || 0} apartments</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LANDLORD CTA */}
      <section className="rb-section rb-landlord rb-reveal" id="landlords">
        <div className="rb-container">
          <div className="rb-linner">
            <div className="rb-lcontent">
              <span className="rb-tag" style={{ background: "rgba(201,168,76,0.15)", color: "var(--gold-bright)" }}>⚡ For property owners</span>
              <h2>Vacancies to fill?<br/>Lease them <span className="accent">faster.</span></h2>
              <p>We partner with hundreds of quality property owners, managers, and developers like you to maximize occupancy and fill vacancies faster, and better. No upfront fees. We only get paid when you win.</p>
              <a href="/landlords" className="rb-btn-pri">Discover the Bolt Way →</a>
            </div>
            <div className="rb-lstats">
              <div className="rb-lcard">
                <div className="num">40,000+</div>
                <div className="label">Units under mandate</div>
              </div>
              <div className="rb-lcard">
                <div className="num">11 Days</div>
                <div className="label">To find the first tenant on average</div>
              </div>
              <div className="rb-lcard">
                <div className="num">0$</div>
                <div className="label">Upfront fees</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="rb-footer" id="contact">
        <div className="rb-fgrid">
          <div className="rb-fbrand">
            <a href="/" className="rb-logo">
              <Bolt />
              RentBolt
            </a>
            <p className="rb-fdesc">
              Apartments, rooms and homes for rent across Canada. Your trusted partner for apartment hunting.
            </p>
          </div>
          <div className="rb-fcol">
            <h4>Renters</h4>
            <ul>
              <li><a href="#properties">Browse apartments</a></li>
              <li><a href="#how">How it works</a></li>
              <li><a href="#cities">Cities</a></li>
              <li><a href="/find-a-place">Start Search</a></li>
            </ul>
          </div>
          <div className="rb-fcol">
            <h4>Property Owners</h4>
            <ul>
              <li><a href="/landlords">Our services</a></li>
              <li><a href="https://calendly.com/rentwithbolt/discoverycall">Discovery call</a></li>
              <li><a href="#landlords">Why RentBolt</a></li>
            </ul>
          </div>
          <div className="rb-fcol">
            <h4>Get in touch</h4>
            <ul>
              <li><a href="tel:+14387937514">(438) 793-7514</a></li>
              <li><a href="mailto:hello@rentbolt.ca">hello@rentbolt.ca</a></li>
              <li><a href="#">227 Galt #320</a></li>
              <li><a href="#">Montréal, QC H4G 2P3</a></li>
            </ul>
          </div>
        </div>
        <div className="rb-fbottom">
          <div>© 2026 RentBolt · All rights reserved</div>
          <div className="rb-flinks">
            <a href="#">Terms</a>
            <a href="#">Privacy</a>
            <a href="#">EN / FR</a>
          </div>
        </div>
      </footer>

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

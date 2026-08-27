"use client";

import { useEffect, useState } from "react";
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

const STEPS = [
  { icon: "🔍", num: "STEP 01", title: "Search", desc: "Browse thousands of partner apartments across 5 Canadian cities." },
  { icon: "👀", num: "STEP 02", title: "Visit", desc: "Book a tour with a leasing consultant — virtually or in-person, your choice." },
  { icon: "📝", num: "STEP 03", title: "Apply", desc: "Apply in minutes from anywhere. Quick background check, fast decision." },
  { icon: "🔑", num: "STEP 04", title: "Move in", desc: "Sign your lease, get your keys, settle into your new home." },
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
          <a href="/landlords">Partnership</a>
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
          <a href="/landlords" onClick={() => setMobileMenu(false)}>Partnership</a>
          <a href="/contact" onClick={() => setMobileMenu(false)}>Contact</a>
          <a href="/find-a-place" className="rb-mobile-cta">Start Search →</a>
        </div>
      )}

      {/* HERO */}
      <section className="rb-hero">
        <div className="rb-hero-container">
          <div className="rb-hero-badge">
            <span className="dot"></span>
            20,000+ apartments across Canada
          </div>
          <h1>Find your next<br/><span className="accent">home.</span></h1>
          <p className="rb-hero-desc">
            Browse thousands of apartments, rooms and homes for rent across Montreal, Toronto, Ottawa and more — managed by your favourite rental agents.
          </p>

          <form className="rb-search" onSubmit={(e) => {
            e.preventDefault();
            const city = e.target.city.value;
            window.location.href = city ? `/search?city=${encodeURIComponent(city)}` : "/search";
          }}>
            <div className="rb-search-field" style={{flex: 1}}>
              <label>📍 City</label>
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
            <button className="rb-search-btn" type="submit" aria-label="Search">→</button>
          </form>
          <p style={{marginTop: "16px", fontSize: "14px", color: "rgba(255,255,255,0.55)"}}>
            Not sure where yet?{" "}
            <a href="/find-a-place" style={{color: "rgba(255,255,255,0.85)", fontWeight: 600, textDecoration: "underline", textUnderlineOffset: "3px"}}>
              Tell us what you're looking for →
            </a>
          </p>

          <div className="rb-hero-stats">
            <div className="rb-stat">
              <div className="num">9,000+</div>
              <div className="label">Active listings</div>
            </div>
            <div className="rb-stat">
              <div className="num">5</div>
              <div className="label">Major cities</div>
            </div>
            <div className="rb-stat">
              <div className="num">80+</div>
              <div className="label">Leasing advisors</div>
            </div>
            <div className="rb-stat">
              <div className="num">4.8 ⭐</div>
              <div className="label">Google reviews</div>
            </div>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <div className="rb-trust">
        <div className="rb-trust-inner">
          <div className="rb-trust-label">As featured in</div>
          <div className="rb-trust-logos">
            <div className="rb-trust-logo">Radio-Canada</div>
            <div className="rb-trust-logo">HEC Montréal</div>
            <div className="rb-trust-logo">Immigrant Québec</div>
            <div className="rb-trust-logo">Je Choisis Montréal</div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="rb-section rb-how rb-reveal" id="how">
        <div className="rb-container">
          <div className="rb-shead">
            <span className="rb-tag">🏡 The RentBolt Way</span>
            <h2>From search to <span className="accent">moving day.</span></h2>
          </div>
          <div className="rb-steps">
            {STEPS.map((step, i) => (
              <div key={i} className="rb-step">
                <div className="rb-step-icon">{step.icon}</div>
                <div className="rb-step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PROPERTIES */}
      <section className="rb-section rb-reveal" id="properties">
        <div className="rb-container">
          <div className="rb-shead">
            <span className="rb-tag">🔥 Latest Properties</span>
            <h2>Apartments available <span className="accent">right now.</span></h2>
            <p>Hand-picked from our portfolio of professionally-managed buildings.</p>
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
                      <h3>{b.address ? b.address.split(",")[0] : b.name}</h3>
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
            <span className="rb-tag">🇨🇦 Where we operate</span>
            <h2>Browse by <span className="accent">city.</span></h2>
            <p>Active in 5 major Canadian markets, with thousands of units under mandate.</p>
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
              <p>We partner with hundreds of quality landlords, property managers and developers to fill vacancies faster, and better. No upfront fees. We only get paid when we deliver tenants.</p>
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
            <h4>Partnership</h4>
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

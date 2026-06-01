"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Search, SlidersHorizontal, X, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BuildingCard from "@/components/BuildingCard";
import { BoltIcon, BoltIconSolid } from "@/components/BoltIcon";
import { markets, amenityIcons, meta } from "@/lib/brand";

// Dynamic import for map (SSR-incompatible)
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

const BED_OPTIONS = [
  { label: "Any", value: -1 },
  { label: "Studio", value: 0 },
  { label: "1 Bed", value: 1 },
  { label: "2 Bed", value: 2 },
  { label: "3+", value: 3 },
];

const AMENITY_FILTERS = ["gym", "parking", "laundry", "pet-friendly"];

function Pill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap ${
        active
          ? "bg-navy text-white"
          : "bg-white text-gray-500 border border-gray-200 hover:border-gray-300"
      }`}
    >
      {children}
    </button>
  );
}

export default function HomeClient({ buildings, cities }) {
  const [city, setCity] = useState("All Markets");
  const [maxPrice, setMaxPrice] = useState(4000);
  const [bed, setBed] = useState(-1);
  const [amenities, setAmenities] = useState([]);
  const [query, setQuery] = useState("");
  const [hoveredId, setHoveredId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [leafletReady, setLeafletReady] = useState(false);

  // Load Leaflet on client
  useEffect(() => {
    if (typeof window !== "undefined" && !window.L) {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
      script.onload = () => setLeafletReady(true);
      document.head.appendChild(script);
    } else if (window.L) {
      setLeafletReady(true);
    }
  }, []);

  const toggleAmenity = (a) =>
    setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]));

  const filtered = useMemo(() => {
    return buildings.filter((b) => {
      if (city !== "All Markets" && b.city !== city) return false;
      if (b.startingPrice > maxPrice) return false;
      if (bed >= 0) {
        if (bed === 3 ? !b.bedrooms?.some((x) => x >= 3) : !b.bedrooms?.includes(bed))
          return false;
      }
      if (amenities.length > 0 && !amenities.every((a) => b.amenities?.includes(a)))
        return false;
      if (query) {
        const q = query.toLowerCase();
        if (
          ![b.name, b.address, b.city].some((s) =>
            s?.toLowerCase().includes(q)
          )
        )
          return false;
      }
      return true;
    });
  }, [buildings, city, maxPrice, bed, amenities, query]);

  const mapCenter = useMemo(() => {
    if (city === "All Markets") return { lat: 45.5, lng: -75.5 };
    const m = markets.find((mk) => mk.name === city);
    return m ? { lat: m.lat, lng: m.lng } : { lat: 45.5, lng: -75.5 };
  }, [city]);

  const mapZoom = useMemo(() => {
    if (city === "All Markets") return 6;
    const m = markets.find((mk) => mk.name === city);
    return m?.zoom || 12;
  }, [city]);

  const handlePinClick = useCallback(
    (id) => {
      const b = buildings.find((x) => x.id === id);
      if (b) {
        window.location.href = `/buildings/${b.slug}`;
      }
    },
    [buildings]
  );

  return (
    <>
      <Header />

      {/* ═══ HERO ═══════════════════════════════════════════════════ */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-4">
              <BoltIconSolid size={14} />
              <span className="text-gold font-bold text-sm uppercase tracking-wider">
                Live Inventory
              </span>
            </div>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold text-navy leading-tight tracking-tight mb-4">
              Find your next
              <br />
              <span className="text-gold">home, faster.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mb-8 leading-relaxed">
              Browse verified apartments across Montreal, Ottawa, Kitchener-Waterloo,
              London & Hamilton. Real-time availability. Real agents.
            </p>

            {/* Search bar */}
            <div className="flex bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden max-w-lg shadow-sm">
              <div className="flex items-center pl-4 text-gray-400">
                <Search size={18} />
              </div>
              <input
                type="text"
                placeholder="Search by building, address, or city..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent border-none outline-none py-3.5 px-3 text-navy text-sm placeholder:text-gray-400"
              />
              <button className="bg-navy text-white px-6 text-sm font-bold hover:bg-navy-light transition-colors">
                Search
              </button>
            </div>

            {/* Quick city links */}
            <div className="flex flex-wrap gap-2 mt-5">
              {markets.slice(0, 5).map((m) => (
                <button
                  key={m.name}
                  onClick={() => setCity(m.name)}
                  className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all ${
                    city === m.name
                      ? "bg-navy text-white"
                      : "text-gray-500 bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MAP + LISTINGS ═════════════════════════════════════════ */}
      <section id="search" className="bg-gray-50 border-t border-gray-200">
        {/* Filter bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 overflow-x-auto">
              {/* City pills */}
              {cities.map((c) => (
                <Pill key={c} active={city === c} onClick={() => setCity(c)}>
                  {c}
                </Pill>
              ))}
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="text-sm text-gray-400 font-medium hidden sm:inline">
                {filtered.length} building{filtered.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => setFiltersOpen((p) => !p)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  filtersOpen
                    ? "bg-navy text-white"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300"
                }`}
              >
                <SlidersHorizontal size={14} />
                Filters
              </button>
            </div>
          </div>

          {/* Expanded filters */}
          {filtersOpen && (
            <div className="border-t border-gray-100 animate-slide-up">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center gap-6">
                {/* Beds */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Beds
                  </span>
                  {BED_OPTIONS.map((o) => (
                    <Pill key={o.value} active={bed === o.value} onClick={() => setBed(o.value)}>
                      {o.label}
                    </Pill>
                  ))}
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* Price */}
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Max
                  </span>
                  <input
                    type="range"
                    min={800}
                    max={4000}
                    step={50}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-28"
                  />
                  <span className="text-navy font-bold text-sm min-w-[56px]">
                    ${maxPrice.toLocaleString()}
                  </span>
                </div>

                <div className="w-px h-6 bg-gray-200" />

                {/* Amenities */}
                <div className="flex items-center gap-2">
                  {AMENITY_FILTERS.map((a) => (
                    <Pill key={a} active={amenities.includes(a)} onClick={() => toggleAmenity(a)}>
                      {amenityIcons[a]}{" "}
                      {a
                        .split("-")
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(" ")}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map + cards layout */}
        <div className="flex" style={{ height: "calc(100vh - 220px)", minHeight: 500 }}>
          {/* Card list */}
          <div className="w-[420px] min-w-[340px] overflow-y-auto p-4 space-y-3 flex-shrink-0 hidden md:block">
            {filtered.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🏠</div>
                <div className="font-bold text-gray-500">No buildings match</div>
                <div className="text-sm mt-1">Try adjusting your filters</div>
              </div>
            )}
            {filtered.map((b) => (
              <BuildingCard
                key={b.id}
                building={b}
                isHovered={hoveredId === b.id}
                onHover={setHoveredId}
                onLeave={() => setHoveredId(null)}
              />
            ))}
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            {leafletReady && (
              <MapView
                buildings={filtered}
                hoveredId={hoveredId}
                onPinClick={handlePinClick}
                center={mapCenter}
                zoom={mapZoom}
              />
            )}
            {/* Watermark */}
            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl px-4 py-2 border border-gray-200 shadow-sm flex items-center gap-2.5 text-xs text-gray-500">
              <BoltIcon size={16} />
              <span className="text-navy font-bold">Live Inventory</span>
              <span>·</span>
              <span>Powered by RentBolt</span>
            </div>
          </div>
        </div>

        {/* Mobile cards (below map on small screens) */}
        <div className="md:hidden p-4 space-y-3">
          {filtered.map((b) => (
            <BuildingCard key={b.id} building={b} />
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ══════════════════════════════════════════ */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-extrabold text-navy mb-3">
              How RentBolt Works
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              A simpler way to find and lease your next apartment.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { icon: "🔍", title: "Search", desc: "Browse verified listings across all our markets with real-time availability." },
              { icon: "📅", title: "Visit", desc: "Book a visit with a RentBolt agent — virtual or in-person, your choice." },
              { icon: "📋", title: "Apply", desc: "Submit your application in a few clicks. We handle the paperwork." },
              { icon: "🏠", title: "Move In", desc: "Sign your lease and move into your new home. Welcome home." },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-gold-subtle rounded-2xl flex items-center justify-center text-2xl mx-auto mb-4">
                  {step.icon}
                </div>
                <h3 className="font-display font-bold text-navy text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LANDLORD CTA ══════════════════════════════════════════ */}
      <section className="bg-navy py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <BoltIconSolid size={14} color="#E2C87E" />
              <span className="text-gold font-bold text-sm uppercase tracking-wider">
                For Landlords & Property Managers
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white leading-tight mb-4">
              Fill your vacancies faster
              <br />
              with qualified tenants.
            </h2>
            <p className="text-white/60 text-lg mb-8 leading-relaxed max-w-xl">
              We partner with hundreds of property owners, managers, and developers
              across Canada. 4,000+ weekly rental inquiries. You only pay when we
              deliver a signed lease.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href={meta.calendly}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gold text-navy px-6 py-3 rounded-xl font-bold hover:bg-gold-light transition-colors"
              >
                Book a Discovery Call
                <ChevronRight size={16} />
              </a>
              <Link
                href="/landlords"
                className="inline-flex items-center gap-2 bg-white/10 text-white px-6 py-3 rounded-xl font-bold hover:bg-white/20 transition-colors"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRESS / TRUST ═════════════════════════════════════════ */}
      <section className="bg-white py-14 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Featured In & Trusted By
          </p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40">
            {["Radio-Canada", "HEC Montréal", "Immigrant Québec", "JeChoisisMontréal"].map(
              (name) => (
                <span
                  key={name}
                  className="text-lg font-display font-bold text-gray-500"
                >
                  {name}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

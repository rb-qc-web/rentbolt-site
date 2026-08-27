"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import FindAPlaceModal from "@/components/FindAPlaceModal";
import { getBuildingPhoto } from "@/lib/cityPhotos";

function Bolt() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="24" height="24">
      <path d="M13 2L4.5 13.5H11L10 22L19.5 10H13L13 2Z" fill="url(#bolt-search)" stroke="url(#bolt-search)" strokeLinejoin="round" strokeWidth="0.5"/>
      <defs>
        <linearGradient id="bolt-search" x1="0" y1="0" x2="24" y2="24">
          <stop offset="0%" stopColor="#E2C87E"/>
          <stop offset="100%" stopColor="#C9A84C"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

const CITY_FILTERS = ["All cities", "Montreal", "Ottawa", "Toronto", "London", "Kitchener-Waterloo"];
const BED_FILTERS = [
  { label: "Any", val: -1 },
  { label: "Studio", val: 0 },
  { label: "1 BR", val: 1 },
  { label: "2 BR", val: 2 },
  { label: "3+ BR", val: 3 },
];

// Default map center: roughly between Montreal and Toronto
const DEFAULT_CENTER = [45.4, -75.6];
const DEFAULT_ZOOM = 6;

const CITY_CENTERS = {
  "Montreal": [45.5017, -73.5673],
  "Ottawa": [45.4215, -75.6972],
  "Toronto": [43.6532, -79.3832],
  "London": [42.9849, -81.2453],
  "Kitchener-Waterloo": [43.4643, -80.5204],
};

function formatBeds(beds) {
  if (!beds || beds.length === 0) return "Mixed unit types";
  return beds.map(b => b === 0 ? "Studio" : `${b}BR`).join(" · ");
}

export default function SearchClient({ buildings, totalCount }) {
  const searchParams = useSearchParams();
  const [city, setCity] = useState(() => {
    const param = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("city")
      : null;
    return param || "All cities";
  });
  const [bed, setBed] = useState(-1);
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [hoverId, setHoverId] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mapPopup, setMapPopup] = useState(null); // { building, x, y }

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const clusterRef = useRef(null);
  const listRef = useRef(null);

  // Filter buildings
  const filtered = useMemo(() => {
    return buildings.filter(b => {
      if (city !== "All cities" && b.city !== city) return false;
      if (bed >= 0) {
        if (bed === 3) {
          if (!b.bedrooms?.some(x => x >= 3)) return false;
        } else {
          if (!b.bedrooms?.includes(bed)) return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${b.name} ${b.area} ${b.city} ${b.address}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [buildings, city, bed, search]);

  // INIT MAP (once)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      if (!mapRef.current || mapInstanceRef.current) return;

      const map = L.map(mapRef.current, {
        zoomControl: true,
        scrollWheelZoom: true,
        attributionControl: false,
      }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(map);

      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution("© OpenStreetMap · CartoDB")
        .addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = {};
      }
    };
  }, []);

  // UPDATE MARKERS when filtered changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    import("leaflet").then(({ default: L }) => {
      const loadCluster = () => new Promise((resolve) => {
        if (L.MarkerClusterGroup) return resolve();
        const s = document.createElement("script");
        s.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
        s.onload = resolve;
        document.head.appendChild(s);
      });
      loadCluster().then(() => {
      // Close popup on map click
      map.on("click", () => { setMapPopup(null); setActiveId(null); });

      // Remove old cluster group
      if (clusterRef.current) {
        map.removeLayer(clusterRef.current);
        clusterRef.current = null;
      }
      markersRef.current = {};

      // Create cluster group styled to RentBolt palette
      const cluster = L.markerClusterGroup({
        maxClusterRadius: 48,
        showCoverageOnHover: false,
        spiderfyOnMaxZoom: true,
        iconCreateFunction: (c) => {
          const count = c.getChildCount();
          const size = count >= 20 ? 52 : count >= 10 ? 44 : 36;
          return L.divIcon({
            html: `<div style="
              width:${size}px;height:${size}px;border-radius:50%;
              background:#0A1F5C;border:3px solid #C9A84C;
              color:#fff;font-size:${size >= 52 ? 15 : 13}px;font-weight:800;
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 16px rgba(10,31,92,0.35);
              font-family:inherit;
            ">${count}</div>`,
            className: "",
            iconSize: [size, size],
          });
        },
      });

      // Add markers to cluster
      filtered.forEach(b => {
        const isActive = b.id === activeId;
        const isHover = b.id === hoverId;
        const pinSize = isActive || isHover ? 36 : 28;
        const fill = isActive || isHover ? "#C9A84C" : "#0A1F5C";
        const border = isActive || isHover ? "#FFFFFF" : "#C9A84C";

        const icon = L.divIcon({
          className: "rb-map-pin",
          html: `<div style="
            width:${pinSize}px;height:${pinSize}px;
            background:${fill};
            border:2px solid ${border};
            border-radius:50% 50% 50% 0;
            transform:rotate(-45deg);
            box-shadow:0 4px 12px rgba(0,0,0,0.2);
            display:flex;align-items:center;justify-content:center;
            cursor:pointer;
          "><div style="transform:rotate(45deg);color:white;font-size:13px;">📍</div></div>`,
          iconSize: [pinSize, pinSize],
          iconAnchor: [pinSize/2, pinSize],
        });

        const marker = L.marker([b.lat, b.lng], { icon })
          .on("click", (e) => {
            setActiveId(b.id);
            const point = map.latLngToContainerPoint([b.lat, b.lng]);
            setMapPopup({ building: b, x: point.x, y: point.y });
            L.DomEvent.stopPropagation(e);
          });

        cluster.addLayer(marker);
        markersRef.current[b.id] = marker;
      });

      map.addLayer(cluster);
      clusterRef.current = cluster;

      // Auto-fit bounds when filters change
      if (filtered.length > 0 && filtered.length < buildings.length) {
        const bounds = L.latLngBounds(filtered.map(b => [b.lat, b.lng]));
        map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
      }
      }); // end loadCluster
    });
  }, [filtered, activeId, hoverId, mapLoaded]);

  // Fly to city when city filter changes
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    if (city === "All cities") {
      mapInstanceRef.current.flyTo(DEFAULT_CENTER, DEFAULT_ZOOM, { duration: 1 });
    } else if (CITY_CENTERS[city]) {
      mapInstanceRef.current.flyTo(CITY_CENTERS[city], 11, { duration: 1 });
    }
  }, [city, mapLoaded]);

  const scrollToCard = (id) => {
    setTimeout(() => {
      const el = document.getElementById(`card-${id}`);
      if (el && listRef.current) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  const handleCardClick = (b) => {
    setActiveId(b.id);
    if (mapInstanceRef.current && b.lat && b.lng) {
      mapInstanceRef.current.flyTo([b.lat, b.lng], 15, { duration: 1.2 });
    }
  };

  const resetFilters = () => {
    setCity("All cities");
    setBed(-1);
    setSearch("");
  };

  return (
    <div className="rb-search-page">
      {/* HEADER */}
      <header className="rb-sheader">
        <a href="/" className="rb-slogo">
          <Bolt />
          RentBolt
        </a>
        <div className="rb-sheader-actions">
          <a href="/" className="rb-sback">← Home</a>
          <a href="/find-a-place" className="rb-snav-cta">Find a Place</a>
        </div>
      </header>

      {/* FILTERS BAR */}
      <div className="rb-sfilters">
        <div className="rb-sfilters-inner">
          <div className="rb-spill-row">
            {CITY_FILTERS.map(c => (
              <button
                key={c}
                className={`rb-spill${city === c ? " active" : ""}`}
                onClick={() => setCity(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="rb-sfilter-controls">
            <div className="rb-sbed-group">
              {BED_FILTERS.map(b => (
                <button
                  key={b.val}
                  className={`rb-sbed${bed === b.val ? " active" : ""}`}
                  onClick={() => setBed(b.val)}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <input
              type="text"
              className="rb-ssearch"
              placeholder="Search by name, area or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {(city !== "All cities" || bed !== -1 || search) && (
              <button className="rb-sreset" onClick={resetFilters}>Reset</button>
            )}
          </div>
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="rb-ssplit">
        <div className="rb-slist" ref={listRef}>
          <div className="rb-slist-header">
            <div className="rb-scount">
              <strong>{filtered.length}</strong> {filtered.length === 1 ? "building" : "buildings"}
              {filtered.length < buildings.length && <span> · filtered from {buildings.length}</span>}
            </div>
            {totalCount > buildings.length && (
              <div className="rb-snote">
                {totalCount - buildings.length} more buildings without coordinates not shown
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rb-sempty">
              <h3>No buildings match these filters</h3>
              <p>Try removing some filters or selecting a different city.</p>
              <button className="rb-sempty-btn" onClick={resetFilters}>Clear all filters</button>
            </div>
          ) : (
            <div className="rb-slist-items">
              {filtered.map(b => (
                <a
                  key={b.id}
                  id={`card-${b.id}`}
                  href={`/buildings/${b.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`rb-scard${activeId === b.id ? " active" : ""}`}
                  onClick={(e) => { e.preventDefault(); handleCardClick(b); window.open(`/buildings/${b.slug}`, "_blank"); }}
                  onMouseEnter={() => setHoverId(b.id)}
                  onMouseLeave={() => setHoverId(null)}
                >
                  {/* Photo strip */}
                  <div className="rb-scard-photo">
                    <img src={getBuildingPhoto(b)} alt={b.name}
                      onError={(e) => { e.currentTarget.src = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=600&fit=crop&q=80"; }} />
                    {b.tag && <div className="rb-scard-tag rb-scard-tag-photo">{b.tag}</div>}
                  </div>
                  <div className="rb-scard-body">
                    <div className="rb-scard-meta">
                      <div className="rb-scard-city">{b.city}{b.area ? ` · ${b.area}` : ""}</div>
  
                    </div>
                    <h3 className="rb-scard-name">{b.publicName || b.name}</h3>
                    <div className="rb-scard-specs">
                      <span>{formatBeds(b.bedrooms)}</span>
                      {b.isFurnished && <span>Furnished</span>}
                    </div>
                  {b.startingPrice > 0 && (
                    <div className="rb-scard-price">from ${Number(b.startingPrice).toLocaleString()}/mo</div>
                  )}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="rb-smap" ref={mapRef} style={{ position: "relative" }}>
          {!mapLoaded && (
            <div className="rb-smap-loading">
              <div className="rb-spinner" />
              <p>Loading map...</p>
            </div>
          )}
          {/* Map popup card */}
          {mapPopup && (() => {
            const b = mapPopup.building;
            const CARD_W = 260;
            const CARD_H = 140;
            // Position above the pin, centered horizontally
            let left = mapPopup.x - CARD_W / 2;
            let top = mapPopup.y - CARD_H - 20;
            return (
              <div style={{
                position: "absolute",
                left: Math.max(8, left),
                top: Math.max(8, top),
                width: CARD_W,
                zIndex: 1000,
                background: "#fff",
                borderRadius: 14,
                boxShadow: "0 8px 32px rgba(10,31,92,0.18)",
                overflow: "hidden",
                border: "1.5px solid #E8EBF0",
                pointerEvents: "auto",
              }}>
                {/* Close */}
                <button onClick={() => { setMapPopup(null); setActiveId(null); }} style={{
                  position: "absolute", top: 8, right: 8, width: 24, height: 24,
                  borderRadius: "50%", border: "none", background: "rgba(0,0,0,0.12)",
                  cursor: "pointer", fontSize: 12, color: "#fff", display: "flex",
                  alignItems: "center", justifyContent: "center", fontWeight: 700, zIndex: 1,
                }}>×</button>
                {/* Image strip */}
                <img src={getBuildingPhoto(b)} alt={b.name} style={{
                  width: "100%", height: 90, objectFit: "cover", display: "block",
                }} onError={(e) => { e.currentTarget.style.display = "none"; }} />
                <div style={{ padding: "12px 14px 14px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#8B92A5", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>
                    {b.city}{b.area ? ` · ${b.area}` : ""}
                    {b.tag && <span style={{ marginLeft: 6, color: "#C9A84C" }}>{b.tag}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: "#0A1F5C", lineHeight: 1.3, marginBottom: 6, paddingRight: 20 }}>
                    {b.publicName || b.name}
                  </div>
                  <div style={{ fontSize: 12, color: "#5A6278", marginBottom: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <span>{formatBeds(b.bedrooms)}</span>
                    
                  </div>
                  <a href={`/buildings/${b.slug}`} style={{
                    display: "block", textAlign: "center", padding: "8px 12px",
                    background: "#0A1F5C", color: "#fff", borderRadius: 8,
                    fontSize: 13, fontWeight: 700, textDecoration: "none",
                  }}>View building →</a>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      <style jsx global>{`
        body { overflow: hidden; }

        .rb-search-page {
          height: 100vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .rb-sheader {
          padding: 16px 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          border-bottom: 1px solid var(--border);
          height: 68px;
          flex-shrink: 0;
        }
        .rb-slogo {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 20px;
          font-weight: 800;
          color: var(--navy);
          text-decoration: none;
          letter-spacing: -0.02em;
        }
        .rb-sheader-actions {
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .rb-sback {
          color: var(--text-mute);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 100px;
          transition: all 0.2s;
        }
        .rb-sback:hover { background: var(--bg-soft); color: var(--navy); }
        .rb-snav-cta {
          padding: 10px 20px;
          background: var(--gold);
          color: var(--navy);
          font-weight: 700;
          font-size: 13px;
          border-radius: 100px;
          text-decoration: none;
          transition: all 0.2s;
          border: none;
          font-family: inherit;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
        }
        .rb-snav-cta:hover {
          background: var(--gold-bright);
          transform: translateY(-1px);
        }

        .rb-sfilters {
          background: white;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
          padding: 14px 32px;
        }
        .rb-sfilters-inner {
          display: flex;
          gap: 24px;
          align-items: center;
          flex-wrap: wrap;
        }
        .rb-spill-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rb-spill {
          padding: 8px 16px;
          background: var(--bg-soft);
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-mute);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .rb-spill:hover { background: var(--border); }
        .rb-spill.active {
          background: var(--navy);
          color: white;
        }
        .rb-sfilter-controls {
          display: flex;
          gap: 12px;
          align-items: center;
          flex: 1;
          min-width: 300px;
        }
        .rb-sbed-group {
          display: flex;
          background: var(--bg-soft);
          border-radius: 100px;
          padding: 3px;
        }
        .rb-sbed {
          padding: 6px 14px;
          background: transparent;
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-mute);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .rb-sbed.active {
          background: white;
          color: var(--navy);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08);
        }
        .rb-ssearch {
          flex: 1;
          max-width: 320px;
          padding: 10px 16px;
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
          transition: border-color 0.2s;
        }
        .rb-ssearch:focus { border-color: var(--gold); }
        .rb-sreset {
          padding: 8px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: 100px;
          font-size: 13px;
          font-weight: 600;
          color: var(--text-mute);
          cursor: pointer;
          font-family: inherit;
          transition: all 0.15s;
        }
        .rb-sreset:hover {
          border-color: var(--navy);
          color: var(--navy);
        }

        .rb-ssplit {
          flex: 1;
          display: grid;
          grid-template-columns: 680px 1fr;
          overflow: hidden;
          min-height: 0;
        }
        .rb-slist {
          overflow-y: auto;
          background: white;
          border-right: 1px solid var(--border);
        }
        .rb-slist-header {
          padding: 20px 24px 16px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: white;
          z-index: 5;
        }
        .rb-scount {
          font-size: 14px;
          color: var(--text-mute);
        }
        .rb-scount strong {
          color: var(--navy);
          font-size: 16px;
          font-weight: 800;
        }
        .rb-snote {
          font-size: 12px;
          color: var(--text-mute);
          margin-top: 4px;
        }
        .rb-slist-items {
          padding: 12px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .rb-slist-items .rb-scard {
          margin-bottom: 0;
        }
        .rb-scard {
          display: block;
          text-decoration: none;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.18s;
          border: 1.5px solid var(--border);
          margin-bottom: 10px;
          overflow: hidden;
          background: #fff;
        }
        .rb-scard:hover {
          border-color: var(--navy);
          box-shadow: 0 4px 20px rgba(10,31,92,0.1);
          transform: translateY(-1px);
        }
        .rb-scard.active {
          border-color: var(--gold);
          box-shadow: 0 4px 20px rgba(201,168,76,0.2);
        }
        .rb-scard-photo {
          width: 100%;
          height: 130px;
          overflow: hidden;
          position: relative;
          background: var(--bg-soft);
        }
        .rb-scard-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.3s;
        }
        .rb-scard:hover .rb-scard-photo img {
          transform: scale(1.04);
        }
        .rb-scard-photo-empty {
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          background: linear-gradient(135deg, #F0F2F7 0%, #E8EBF0 100%);
        }
        .rb-scard-tag {
          font-size: 10px;
          font-weight: 700;
          color: var(--navy);
          background: var(--gold-soft);
          padding: 3px 8px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .rb-scard-tag-photo {
          position: absolute;
          top: 10px;
          left: 10px;
        }
        .rb-scard-body {
          padding: 14px 16px 16px;
        }
        .rb-scard-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 5px;
        }
        .rb-scard-city {
          font-size: 11px;
          font-weight: 700;
          color: var(--gold-dark, var(--gold));
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }
        .rb-scard-price {
          font-size: 13px;
          font-weight: 800;
          color: var(--navy);
          margin-top: 8px;
          letter-spacing: -0.02em;
        }
        .rb-scard-vacant {
          font-size: 11px;
          font-weight: 700;
          color: #16a34a;
        }
        .rb-scard-name {
          font-size: 16px;
          font-weight: 800;
          color: var(--navy);
          margin-bottom: 3px;
          letter-spacing: -0.02em;
          line-height: 1.25;
        }
        .rb-scard-addr {
          font-size: 12px;
          color: var(--text-mute);
          margin-bottom: 10px;
          line-height: 1.4;
        }
        .rb-scard-specs {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .rb-scard-specs span {
          font-size: 11px;
          font-weight: 600;
          color: var(--text-mute);
          padding: 3px 9px;
          background: var(--bg-soft);
          border-radius: 100px;
        }

        .rb-sempty {
          padding: 60px 32px;
          text-align: center;
        }
        .rb-sempty h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--navy);
          margin-bottom: 8px;
        }
        .rb-sempty p {
          font-size: 14px;
          color: var(--text-mute);
          margin-bottom: 20px;
        }
        .rb-sempty-btn {
          padding: 10px 20px;
          background: var(--navy);
          color: white;
          border: none;
          border-radius: 100px;
          font-size: 13px;
          font-weight: 700;
          cursor: pointer;
          font-family: inherit;
        }

        .rb-smap {
          background: var(--bg-soft);
          position: relative;
        }
        .rb-smap-loading {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: var(--text-mute);
        }
        .rb-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid var(--border);
          border-top-color: var(--gold);
          border-radius: 50%;
          animation: rb-spin 0.8s linear infinite;
        }
        @keyframes rb-spin {
          to { transform: rotate(360deg); }
        }

        .rb-map-pin { background: transparent !important; border: none !important; }

        /* MOBILE */
        @media (max-width: 968px) {
          .rb-ssplit { grid-template-columns: 1fr; }
          .rb-slist { display: none; }
          .rb-smap { height: 100%; }
          .rb-sfilters { padding: 12px 16px; }
          .rb-sfilters-inner { gap: 12px; }
          .rb-sheader { padding: 12px 16px; }
        }
      `}</style>

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

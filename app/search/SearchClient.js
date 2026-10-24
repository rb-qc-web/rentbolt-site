"use client";

import "./search.css";

import { useEffect, useMemo, useRef, useState } from "react";
import FavouriteButton from "@/app/components/FavouriteButton";
import SavedNavLink from "@/app/components/SavedNavLink";
import { useSearchParams } from "next/navigation";
import FindAPlaceModal from "@/components/FindAPlaceModal";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import { canonLabel, canonKey, listHas } from "@/lib/labels";
import { priceForBed, effectivePrice } from "@/lib/unitTypes";

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

const CITY_FILTERS = ["All cities", "Montreal", "Ottawa", "Toronto", "Mississauga", "Ajax", "London", "Kitchener-Waterloo"];
// Filters live in the URL so a refresh, a back button or a shared link all
// restore the same search. replaceState rather than push: changing a filter is
// not a new page, and pushing would make Back step through every tweak.
const LAST_CITY_KEY = "rentbolt:lastCity";

const readParams = () =>
  typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);

// "|" rather than "," because some labels contain commas.
const listParam = (p, key) => {
  const v = p.get(key);
  return v ? v.split("|").map(x => x.trim()).filter(Boolean) : [];
};

// localStorage throws in private mode and can be blocked outright, so every
// access is guarded and the page works fine without it.
function readLastCity() {
  try { return localStorage.getItem(LAST_CITY_KEY) || ""; } catch { return ""; }
}

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
  "Mississauga": [43.5890, -79.6441],
  "Ajax": [43.8509, -79.0204],
  "London": [42.9849, -81.2453],
  "Kitchener-Waterloo": [43.4643, -80.5204],
};

function formatBeds(beds) {
  if (!beds || beds.length === 0) return "Mixed unit types";
  return beds.map(b => b === 0 ? "Studio" : `${b}BR`).join(" · ");
}


// Everything below reads the per-board pill lists FIRST and treats the
// dedicated monday columns as a bonus, because those column ids
// (dropdown_mkvpaxpe pets, dropdown_mkvp2xa8 parking, the utility dropdowns)
// exist only on the Montreal board. Keying a filter off them alone is the trap
// that silently emptied the bed filters on four boards.
function pills(b) {
  return [...(b.inclusionsList || []), ...(b.amenitiesList || []), ...(b.appliancesList || [])];
}
function pillMatch(b, re) {
  return pills(b).some(x => re.test(x));
}

function isPetFriendly(b) {
  // An explicit "Pet friendly" inclusion pill settles it.
  if (pills(b).some(x => /pet.?friendly/i.test(x))) return true;

  const t = String(b.pets || "").toLowerCase().trim();
  if (!t) return false;

  // Naming a species is almost always permission — "Cats Only", "Cats & Small
  // dogs", "Cats Yes, Dogs No", even "No Pets - Cats are tolerated" all mean
  // SOME pet is welcome. The exception is a flat refusal that happens to name
  // the animals it is refusing.
  if (/\bcats?\b|\bdogs?\b/.test(t)) {
    if (/^no\b/.test(t) && !/\b(yes|ok|okay|allowed|tolerated|only|small|welcome)\b/.test(t)) return false;
    return true;
  }

  // Checked before the positives: "No Pets Allowed" contains "allowed", which
  // is why this filter used to show buildings that ban pets.
  if (/\bno\b|\bnone\b/.test(t)) return false;

  return /\byes\b|allowed|friendly|welcome/.test(t);
}

function hasParking(b) {
  if (pillMatch(b, /parking/i)) return true;
  const v = String(b.parking || "").trim();
  return v.length > 0 && !/^(no|none|n\/a|not available)$/i.test(v);
}

// Every option list is built from the buildings actually present, with counts,
// so a filter can never offer something that returns nothing.
//
// Grouping is by canonical label, not raw text: otherwise "Laundry room" and
// "Laundry Room" sit in the menu as two separate options, and picking both
// matches nothing.
function tally(buildings, pick) {
  const counts = {};
  const display = {};
  for (const b of buildings) {
    for (const v of pick(b) || []) {
      const raw = String(v).trim();
      if (!raw) continue;
      const k = canonKey(raw);
      if (!k) continue;
      counts[k] = (counts[k] || 0) + 1;
      if (!display[k]) display[k] = canonLabel(raw);
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1] || display[a[0]].localeCompare(display[b[0]]))
    .map(([k, count]) => ({ name: display[k], count }));
}


function Caret() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/** Dropdown with a checkbox list. Filters live as you tick — no Apply step,
 *  since the result count is visible behind the menu anyway. */
function CheckMenu({ label, icon, options, picks, setPicks, open, onToggle }) {
  const toggle = name =>
    setPicks(p => (p.includes(name) ? p.filter(x => x !== name) : [...p, name]));
  return (
    <div className="rb-sdd">
      <button type="button" className={`rb-sdd-btn${picks.length ? " on" : ""}`} onClick={onToggle}>
        {icon && <span className="rb-sdd-emoji" aria-hidden="true">{icon}</span>}
        {label}{picks.length > 0 && ` · ${picks.length}`}
        <Caret />
      </button>
      {open && (
        <div className="rb-sdd-menu">
          <div className="rb-sdd-list">
            {options.map(o => (
              <label key={o.name} className="rb-sdd-item">
                <input type="checkbox" checked={picks.includes(o.name)} onChange={() => toggle(o.name)} />
                <span className="rb-sdd-box" aria-hidden="true" />
                {o.name}
              </label>
            ))}
          </div>
          {picks.length > 0 && (
            <div className="rb-sdd-foot">
              <button onClick={() => setPicks([])}>Clear</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SearchClient({ buildings, totalCount }) {
  const searchParams = useSearchParams();
  // A link's ?city= wins; otherwise reopen on whatever city was last used,
  // because people work one market at a time and resetting to All cities on
  // every refresh threw that away.
  const [city, setCity] = useState(() => readParams().get("city") || readLastCity() || "All cities");
  const [bed, setBed] = useState(() => {
    const n = parseInt(readParams().get("beds") ?? "", 10);
    return [0, 1, 2, 3].includes(n) ? n : -1;
  });
  const [hood, setHood] = useState(() => readParams().get("hood") || "All neighbourhoods");
  const [priceRange, setPriceRange] = useState(() => {   // null = untouched
    const p = readParams();
    const lo = parseInt(p.get("min") ?? "", 10);
    const hi = parseInt(p.get("max") ?? "", 10);
    return Number.isFinite(lo) && Number.isFinite(hi) && hi > lo ? [lo, hi] : null;
  });
  const [amenityPicks, setAmenityPicks] = useState(() => listParam(readParams(), "amenities"));
  const [inclusionPicks, setInclusionPicks] = useState(() => listParam(readParams(), "inclusions"));
  const [petsOnly, setPetsOnly] = useState(() => readParams().get("pets") === "1");
  const [parkingOnly, setParkingOnly] = useState(() => readParams().get("parking") === "1");
  // The extra filters are open by default: they are the useful ones, and a
  // renter who never presses "Filters" never discovers them.
  const [panelOpen, setPanelOpen] = useState(true);
  const [openMenu, setOpenMenu] = useState(null);
  const [search, setSearch] = useState(() => readParams().get("q") || "");
  // Guards the city-change resets below so a restored search survives mount.
  const firstRun = useRef(true);
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
  // Remembers the filter set we last auto-fitted to, so selecting or hovering
  // a card doesn't re-trigger fitBounds and yank the map back out.
  const lastFitKeyRef = useRef(null);

  // Filter buildings
  const hoodOptions = useMemo(() => {
    if (city === "All cities") return [];
    const counts = {};
    for (const b of buildings) {
      if (b.city !== city) continue;
      const n = b.neighbourhood;
      if (n) counts[n] = (counts[n] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [buildings, city]);

  useEffect(() => {
    if (!openMenu) return;
    const close = e => { if (!e.target.closest(".rb-sdd")) setOpenMenu(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [openMenu]);

  // Reset the neighbourhood whenever the city changes, or it would filter
  // against a borough that doesn't exist in the new city.
  useEffect(() => {
    if (firstRun.current) return;   // a neighbourhood restored from the URL is not a city change
    setHood("All neighbourhoods");
  }, [city]);

  // Options reflect the current city so you never see an amenity that only
  // exists in another market.
  const scopeForOptions = useMemo(
    () => (city === "All cities" ? buildings : buildings.filter(b => b.city === city)),
    [buildings, city]
  );
  const amenityOptions   = useMemo(() => tally(scopeForOptions, b => b.amenitiesList), [scopeForOptions]);
  // "Pet friendly" is an Inclusions option on the Ontario boards and also has
  // its own toggle. Leaving it in both means picking it here quietly excludes
  // every Montreal building, whose board words pets differently.
  const inclusionOptions = useMemo(
    () => tally(scopeForOptions, b => (b.inclusionsList || []).filter(x => !/pet.?friendly/i.test(x))),
    [scopeForOptions]
  );
  const petCount         = useMemo(() => scopeForOptions.filter(isPetFriendly).length, [scopeForOptions]);
  const parkingCount     = useMemo(() => scopeForOptions.filter(hasParking).length, [scopeForOptions]);

  // Slider bounds come from what is actually listed, rounded outward to clean
  // $50 steps, so the handles always span the real range for this city.
  const priceBounds = useMemo(() => {
    const prices = scopeForOptions.map(b => b.startingPrice).filter(p => p > 0);
    if (prices.length < 2) return null;
    const lo = Math.floor(Math.min(...prices) / 50) * 50;
    const hi = Math.ceil(Math.max(...prices) / 50) * 50;
    return hi > lo ? { lo, hi } : null;
  }, [scopeForOptions]);

  // Untouched means "no filter", so the range follows the data as the city
  // changes instead of stranding the handles at another market's numbers.
  const price = priceRange || (priceBounds ? [priceBounds.lo, priceBounds.hi] : [0, 0]);
  const priceTouched = Boolean(
    priceRange && priceBounds && (priceRange[0] > priceBounds.lo || priceRange[1] < priceBounds.hi)
  );

  // Anything picked in one city may not exist in the next, so clear on change.
  useEffect(() => {
    if (firstRun.current) return;   // keep whatever the URL restored
    setAmenityPicks([]); setInclusionPicks([]); setPetsOnly(false); setPriceRange(null);
    setParkingOnly(false);
  }, [city]);

  // Declared after the two effects above so both see firstRun as true on mount
  // and skip their reset; from here on a city change clears as it should.
  useEffect(() => { firstRun.current = false; }, []);

  // The map layout needs the page itself not to scroll. Previously a global
  // CSS rule; set here instead so it cannot leak to any other page, and
  // restored on unmount.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, []);

  // Mirror the live filters into the URL. Only non-default values are written,
  // so an untouched search stays at a clean /search.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams();
    if (city !== "All cities") p.set("city", city);
    if (bed >= 0) p.set("beds", String(bed));
    if (hood !== "All neighbourhoods") p.set("hood", hood);
    if (search.trim()) p.set("q", search.trim());
    if (priceTouched) { p.set("min", String(price[0])); p.set("max", String(price[1])); }
    if (inclusionPicks.length) p.set("inclusions", inclusionPicks.join("|"));
    if (amenityPicks.length) p.set("amenities", amenityPicks.join("|"));
    if (parkingOnly) p.set("parking", "1");
    if (petsOnly) p.set("pets", "1");
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [city, bed, hood, search, priceTouched, price[0], price[1],
      inclusionPicks, amenityPicks, parkingOnly, petsOnly]);

  // Remembered separately from the URL so a bare /search still opens on the
  // city they were last working in.
  useEffect(() => {
    try { localStorage.setItem(LAST_CITY_KEY, city); } catch { /* private mode */ }
  }, [city]);

  const extraCount =
    (priceTouched ? 1 : 0) + amenityPicks.length + inclusionPicks.length +
    (petsOnly ? 1 : 0) + (parkingOnly ? 1 : 0);

  const filtered = useMemo(() => {
    return buildings.filter(b => {
      if (city !== "All cities" && b.city !== city) return false;
      if (hood !== "All neighbourhoods" && b.neighbourhood !== hood) return false;

      // Budget is judged against the bedroom type being searched for, not the
      // building's cheapest unit. Le Vittorio's studio is $1,525 and its 2BR
      // is $2,625; a 2BR search from $2,500 used to drop the building on the
      // strength of a studio nobody asked about.
      //
      // Only filters buildings that HAVE a price. One with no price yet is
      // kept — it may well be in budget, and hiding it would punish the
      // listing for a data gap rather than for its rent.
      const budgetPrice = effectivePrice(b, bed);
      if (priceTouched && budgetPrice > 0 &&
          (budgetPrice < price[0] || budgetPrice > price[1])) return false;

      if (petsOnly && !isPetFriendly(b)) return false;
      if (parkingOnly && !hasParking(b)) return false;
      if (amenityPicks.length && !amenityPicks.every(a => listHas(b.amenitiesList, a))) return false;
      if (inclusionPicks.length && !inclusionPicks.every(i => listHas(b.inclusionsList, i))) return false;
      if (bed >= 0) {
        if (bed === 3) {
          if (!b.bedrooms?.some(x => x >= 3)) return false;
        } else {
          if (!b.bedrooms?.includes(bed)) return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const hay = `${b.name} ${b.neighbourhood} ${b.area} ${b.city} ${b.address}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [buildings, city, hood, bed, search, priceTouched, price, petsOnly, parkingOnly, amenityPicks, inclusionPicks]);
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

      // Basemap. Carto Positron (the clean light style) now requires an API
      // key. If one is present we use it; otherwise we fall back to Esri's
      // World Light Gray Canvas, which is keyless and visually very close.
      // Setting NEXT_PUBLIC_CARTO_API_KEY in Vercel switches this back to
      // Carto with no code change.
      const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY;

      const basemap = cartoKey
        ? {
            url: `https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?api_key=${cartoKey}`,
            options: { subdomains: "abcd", maxZoom: 20 },
            attribution: "© OpenStreetMap · © CARTO",
          }
        : {
            url: "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}",
            options: { maxZoom: 16 },
            attribution: "Esri — Light Gray Canvas",
          };

      L.tileLayer(basemap.url, basemap.options).addTo(map);

      // Esri's gray canvas omits street labels at some zooms; overlay the
      // reference layer so street names stay readable.
      if (!cartoKey) {
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 16 }
        ).addTo(map);
      }

      L.control.attribution({ position: "bottomright", prefix: false })
        .addAttribution(basemap.attribution)
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

      // Auto-fit bounds ONLY when the filter set itself changes.
      // This effect also re-runs on activeId/hoverId, and previously refitted
      // every time — which cancelled the flyTo from clicking a card and made
      // the map appear to zoom out on every selection.
      const fitKey = `${city}|${bed}|${search}|${filtered.length}`;
      if (
        lastFitKeyRef.current !== fitKey &&
        filtered.length > 0 &&
        filtered.length < buildings.length
      ) {
        const located = filtered.filter(b => b.lat && b.lng);
        if (located.length) {
          const bounds = L.latLngBounds(located.map(b => [b.lat, b.lng]));
          map.fitBounds(bounds, { padding: [60, 60], maxZoom: 13 });
        }
        lastFitKeyRef.current = fitKey;
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
    setHood("All neighbourhoods");
    setPriceRange(null);
    setAmenityPicks([]);
    setInclusionPicks([]);
    setPetsOnly(false);
    setParkingOnly(false);
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
          <SavedNavLink />
          <a href="/find-a-place" className="rb-snav-cta">Find a Place</a>
        </div>
      </header>

      {/* FILTERS BAR */}
      <div className="rb-sfilters">
        <div className="rb-sfilters-inner">
          <div className="rb-sfilter-controls">
            {/* City is a dropdown rather than a pill row: it stays compact and
                keeps working as more markets are added. */}
            <div className="rb-scity-wrap">
              <select
                className="rb-scity"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                aria-label="Filter by city"
              >
                {CITY_FILTERS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <svg className="rb-scity-caret" width="14" height="14" viewBox="0 0 24 24"
                   fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </div>

            {hoodOptions.length > 0 && (
              <div className="rb-scity-wrap">
                <select
                  className="rb-scity rb-shood"
                  value={hood}
                  onChange={(e) => setHood(e.target.value)}
                  aria-label="Filter by neighbourhood"
                >
                  <option value="All neighbourhoods">All neighbourhoods</option>
                  {hoodOptions.map(o => (
                    <option key={o.name} value={o.name}>{o.name} ({o.count})</option>
                  ))}
                </select>
                <svg className="rb-scity-caret" width="14" height="14" viewBox="0 0 24 24"
                     fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </div>
            )}

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

            {/* One panel rather than four more controls in the row: the bar
                already wraps awkwardly at laptop widths. */}
            <button
              type="button"
              className={`rb-smore${extraCount ? " on" : ""}`}
              onClick={() => setPanelOpen(o => !o)}
              aria-expanded={panelOpen}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                <path d="M4 6h16M7 12h10M10 18h4" />
              </svg>
              Filters
              {extraCount > 0 && <span className="rb-smore-count">{extraCount}</span>}
            </button>

            <input
              type="text"
              className="rb-ssearch"
              placeholder="Search by name, area or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {(city !== "All cities" || bed !== -1 || search || hood !== "All neighbourhoods" || extraCount > 0) && (
              <button className="rb-sreset" onClick={resetFilters}>Reset</button>
            )}
          </div>

          {panelOpen && (
            <div className="rb-srow2">
              {priceBounds && (
                <div className="rb-sdd">
                  <button
                    type="button"
                    className={`rb-sdd-btn${priceTouched ? " on" : ""}`}
                    onClick={() => setOpenMenu(openMenu === "budget" ? null : "budget")}
                  >
                    <span className="rb-sdd-emoji" aria-hidden="true">💰</span>
                    {priceTouched
                      ? `$${price[0].toLocaleString()} – $${price[1].toLocaleString()}`
                      : "Budget"}
                    <Caret />
                  </button>
                  {openMenu === "budget" && (
                    <div className="rb-sdd-menu rb-sdd-menu-budget">
                      <div className="rb-sbudget-fields">
                        <div>
                          <span>Min</span>
                          <strong>${price[0].toLocaleString()}</strong>
                        </div>
                        <div>
                          <span>Max</span>
                          <strong>${price[1].toLocaleString()}{price[1] >= priceBounds.hi && "+"}</strong>
                        </div>
                      </div>

                      {/* Two overlaid inputs; only the thumbs take pointer
                          events so neither handle blocks the other. */}
                      <div className="rb-srange">
                        <div className="rb-srange-track" />
                        <div className="rb-srange-fill" style={{
                          left: `${((price[0] - priceBounds.lo) / (priceBounds.hi - priceBounds.lo)) * 100}%`,
                          right: `${100 - ((price[1] - priceBounds.lo) / (priceBounds.hi - priceBounds.lo)) * 100}%`,
                        }} />
                        <input type="range" min={priceBounds.lo} max={priceBounds.hi} step={50}
                          value={price[0]} aria-label="Minimum monthly budget"
                          onChange={e => setPriceRange([Math.min(Number(e.target.value), price[1] - 50), price[1]])} />
                        <input type="range" min={priceBounds.lo} max={priceBounds.hi} step={50}
                          value={price[1]} aria-label="Maximum monthly budget"
                          onChange={e => setPriceRange([price[0], Math.max(Number(e.target.value), price[0] + 50)])} />
                      </div>

                      <div className="rb-sdd-foot">
                        <span>${priceBounds.lo.toLocaleString()}</span>
                        {priceTouched && <button onClick={() => setPriceRange(null)}>Clear</button>}
                        <span>${priceBounds.hi.toLocaleString()}+</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {inclusionOptions.length > 0 && (
                <CheckMenu
                  label="Inclusions"
                  icon="✅"
                  options={inclusionOptions}
                  picks={inclusionPicks}
                  setPicks={setInclusionPicks}
                  open={openMenu === "inclusions"}
                  onToggle={() => setOpenMenu(openMenu === "inclusions" ? null : "inclusions")}
                />
              )}

              {amenityOptions.length > 0 && (
                <CheckMenu
                  label="Amenities"
                  icon="🏢"
                  options={amenityOptions}
                  picks={amenityPicks}
                  setPicks={setAmenityPicks}
                  open={openMenu === "amenities"}
                  onToggle={() => setOpenMenu(openMenu === "amenities" ? null : "amenities")}
                />
              )}

              {parkingCount > 0 && (
                <button
                  type="button"
                  className={`rb-sdd-btn${parkingOnly ? " on" : ""}`}
                  onClick={() => setParkingOnly(v => !v)}
                >
                  <span className="rb-sdd-emoji" aria-hidden="true">🅿️</span>
                  Parking
                </button>
              )}

              {petCount > 0 && (
                <button
                  type="button"
                  className={`rb-sdd-btn${petsOnly ? " on" : ""}`}
                  onClick={() => setPetsOnly(v => !v)}
                >
                  <span className="rb-sdd-emoji" aria-hidden="true">🐾</span>
                  Pet friendly
                </button>
              )}

              {!priceBounds && inclusionOptions.length === 0 &&
               amenityOptions.length === 0 &&
               parkingCount === 0 && petCount === 0 && (
                <p className="rb-spanel-empty">No extra filters available for this city yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* SPLIT LAYOUT */}
      <div className="rb-ssplit">
        <div className="rb-slist" ref={listRef}>
          {/* Tells people the heart does something — without it the control is
              easy to miss and the saved list never gets used. */}
          {filtered.length > 0 && (
            <div className="rb-shint">
              Save the places you like with the
              <span className="rb-shint-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"
                     strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21.2l7.7-7.7 1.1-1.1a5.5 5.5 0 0 0 0-7.8z" />
                </svg>
              </span>
              icon — we&apos;ll help you with your shortlist.
            </div>
          )}
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
                    <FavouriteButton id={b.id} />
                  </div>
                  <div className="rb-scard-body">
                    <div className="rb-scard-meta">
                      <div className="rb-scard-city">{b.city}{b.neighbourhood ? ` · ${b.neighbourhood}` : ""}</div>
  
                    </div>
                    <h3 className="rb-scard-name">{b.publicName || b.name}</h3>
                    <div className="rb-scard-specs">
                      <span>{formatBeds(b.bedrooms)}</span>
                      {b.isFurnished && <span>Furnished</span>}
                    </div>
                  {(() => {
                    // With a bed filter on, show THAT unit's price. Otherwise a
                    // 2BR search from $2,500 returns Le Vittorio reading
                    // "from $1,525/mo" and looks like a bug of its own.
                    const bedPrice = priceForBed(b, bed);
                    const shown = bedPrice ?? b.startingPrice;
                    if (!(shown > 0)) {
                      return <div className="rb-scard-price rb-scard-price-none">Contact us for pricing</div>;
                    }
                    const prefix = bedPrice ? `${BED_FILTERS.find(f => f.val === bed)?.label} from` : "from";
                    return (
                      <div className="rb-scard-price">
                        {prefix} ${Number(shown).toLocaleString()}/mo
                      </div>
                    );
                  })()}
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* End-of-list CTA. A visitor who reaches the bottom has not found
              what they want — catch them here rather than losing them. */}
          <div className="rb-scta">
            <h3>Didn&apos;t find what you were looking for?</h3>
            <p>
              We have more options than we list publicly. Tell us what you need and
              a RentBolt agent will find it for you.
            </p>
            <a href="/find-a-place" className="rb-scta-btn">Tell us what you&apos;re looking for →</a>
          </div>
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
                    {b.city}{b.neighbourhood ? ` · ${b.neighbourhood}` : ""}
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

      <FindAPlaceModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

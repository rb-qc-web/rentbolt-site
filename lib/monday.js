import { cache } from "react";
import { Redis } from "@upstash/redis";

const CACHE_KEY = "rentbolt:buildings:v4";
const CACHE_TTL = 60 * 15; // 15 minutes

function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

const MONDAY_API_URL = "https://api.monday.com/v2";

// 5 LISTINGS DATABASE BOARDS
export const BOARDS = {
  montreal: { id: 3743206409, name: "Listings Database", city: "Montreal", region: "Quebec",
    locationColId: "location" },
  ottawa: { id: 4955235841, name: "Listings Database - Ottawa", city: "Ottawa", region: "Ontario",
    locationColId: "location" },
  toronto: { id: 18402583974, name: "Listings Database - Toronto", city: "Toronto", region: "Ontario",
    locationColId: "location_mm3yrv60" },
  london: { id: 18401824343, name: "Listings Database - London", city: "London", region: "Ontario",
    locationColId: "location_mm3yfrwf" },
  kwcg: { id: 5892819868, name: "Listings Database - K-W-C-G", city: "Kitchener-Waterloo", region: "Ontario",
    locationColId: "location_mm3yr7wf" },
};

// Toronto-specific extra dropdown columns
const COL_TORONTO = {
  amenities2:  "dropdown_mm3ys2c5",
  appliances:  "dropdown_mm3y27xp",
  inclusions2: "dropdown_mm18ck2t",
};

const COL = {
  pictures: "text_mkxvrp7p", vacancies: "text", buildingInfo: "long_text1",
  apartmentEntry: "apartment_entry", location: "location", promo: "text3",
  appProcess: "long_text86", numVacant: "numeric", numTotal: "numbers",
  status: "status2", website: "text_mkt2c8", furnished: "dropdown_mkvpjqc3",
  area: "dropdown_mkvqrg13", unitsAvail: "dropdown_mkvpnqth", appliances: "dropdown_mkvpddyr",
  heating: "dropdown_mkvp7ydk", electricity: "dropdown_mkvp4zv7", hotwater: "dropdown_mkvp1m8y",
  internet: "dropdown_mkvp5qrn", parking: "dropdown_mkvp2xa8", amenities: "dropdown_mkvpebxp",
  pets: "dropdown_mkvpaxpe",
  pStudioMin: "numeric_mkvpj4tc", pStudioMax: "numeric_mkvpdy1g",
  p1bMin: "numeric_mkvpxb52", p1bMax: "numeric_mkvpf4d4",
  p2bMin: "numeric_mkvp1k9p", p2bMax: "numeric_mkvpx6qm",
  p3bMin: "numeric_mkvpd4ne", p3bMax: "numeric_mkvpftms",
  p4bMin: "numeric_mkvpdq4k", p4bMax: "numeric_mkvp4aey",
};

const COLUMN_IDS_TO_FETCH = Object.values(COL);

async function mondayQuery(query, variables = {}) {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return null;
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: apiKey },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(`Monday API: ${JSON.stringify(json.errors)}`);
  return json.data;
}

function slugify(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function parseBuilding(item, board) {
  const cols = {};
  const raw = {};
  for (const col of item.column_values) {
    cols[col.id] = col.text || "";
    raw[col.id] = col.value || "";
  }

  const statusText = cols[COL.status] || "";
  const isActive = statusText === "Lease-Up" || statusText === "Stabilization";
  if (!isActive) return null;

  // Use the board's location column ID (may differ between boards)
  const locColId = board.locationColId || COL.location;
  let lat = 0, lng = 0;
  let address = cols[locColId] || "";
  const locRaw = raw[locColId];
  if (locRaw) {
    try {
      const loc = JSON.parse(locRaw);
      lat = parseFloat(loc.lat) || 0;
      lng = parseFloat(loc.lng) || 0;
      if (loc.address) address = loc.address;
    } catch (e) {}
  }

  const unitsAvailStr = cols[COL.unitsAvail] || "";
  const bedrooms = [];
  if (unitsAvailStr.includes("Studio")) bedrooms.push(0);
  if (unitsAvailStr.match(/\b1\b/)) bedrooms.push(1);
  if (unitsAvailStr.match(/\b2\b/)) bedrooms.push(2);
  if (unitsAvailStr.match(/\b3\b/)) bedrooms.push(3);
  if (unitsAvailStr.includes("4+")) bedrooms.push(4);

  const allMinPrices = [
    parseInt(cols[COL.pStudioMin], 10),
    parseInt(cols[COL.p1bMin], 10),
    parseInt(cols[COL.p2bMin], 10),
    parseInt(cols[COL.p3bMin], 10),
    parseInt(cols[COL.p4bMin], 10),
  ].filter(p => p > 0);
  const startingPrice = allMinPrices.length > 0 ? Math.min(...allMinPrices) : 0;

  const amenStr = cols[COL.amenities] || "";
  const amenities = amenStr.split(",").map(s => s.trim()).filter(Boolean);
  const area = cols[COL.area] || "";

  // Promo tag — only show if promo field has real content (not empty, not "NO PROMO" variants)
  const promoRaw = (cols[COL.promo] || "").trim();
  const hasPromo = promoRaw.length > 0
    && !promoRaw.toLowerCase().includes("no promo")
    && !promoRaw.toLowerCase().includes("no promotion")
    && promoRaw.toLowerCase() !== "n/a"
    && promoRaw.toLowerCase() !== "none";

  let tag = null;
  if (statusText === "Lease-Up") tag = "Available now";
  else if (hasPromo) tag = "In-Demand";

  const furnished = cols[COL.furnished] || "";
  const isFurnished = furnished === "Yes" || furnished === "Yes for extra" || furnished === "Some-units only";

  // Photo column may be:
  //  - a JSON array (new gallery format from migration): ["url1","url2",...]
  //  - a plain Drive/CF URL string (legacy single image)
  //  - a comma/newline separated list (old multi-link format)
  const rawPictures = cols[COL.pictures] || "";
  let photoUrl = "";
  let photoGallery = [];

  if (rawPictures.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(rawPictures);
      if (Array.isArray(parsed)) {
        photoGallery = parsed.filter(u => typeof u === "string" && u.startsWith("http"));
        photoUrl = photoGallery[0] || "";
      }
    } catch {
      // fall through to legacy parsing below
    }
  }

  if (!photoUrl) {
    let single = rawPictures;
    if (single.includes("\n")) single = single.split("\n")[0].trim();
    if (single.includes(",")) single = single.split(",")[0].trim();
    if (single && single.startsWith("http")) {
      photoUrl = single;
      photoGallery = [single];
    }
  }

  const vacantCount = parseInt(cols[COL.numVacant], 10) || 0;

  // Toronto-specific dropdown columns
  const parsePills = (id) => (cols[id] || "").split(",").map(s => s.trim()).filter(Boolean);
  const amenitiesList  = parsePills(COL_TORONTO.amenities2);
  const appliancesList = parsePills(COL_TORONTO.appliances);
  const inclusionsList = parsePills(COL_TORONTO.inclusions2);

  // Parse subitems → pricing rows + description
  const SKIP_NAMES = ["photos", "descriptions", "agent"];
  const unitPrices = [];
  let subitemDescription = "";
  let subitemPhotosUrl = "";

  (item.subitems || []).forEach(sub => {
    const subName = sub.name?.trim() || "";
    const subLower = subName.toLowerCase();
    // Extract description from "Descriptions" subitem
    if (subLower === "descriptions") {
      const descCol = sub.column_values?.find(cv => cv.id === "long_text5");
      if (descCol?.text) subitemDescription = descCol.text;
      return;
    }
    // Extract photos link from "Photos" subitem
    if (subLower === "photos") {
      const linkCol = sub.column_values?.find(cv => cv.id === "link");
      if (linkCol?.text) subitemPhotosUrl = linkCol.text;
      return;
    }
    // Skip any other non-unit subitems
    if (SKIP_NAMES.some(s => subLower.includes(s))) return;
    // Parse price from numeric column
    const priceCol = sub.column_values?.find(cv => cv.id === "numeric");
    const price = priceCol?.text ? parseInt(priceCol.text, 10) : null;
    if (price || subName) {
      unitPrices.push({ type: subName, price });
    }
  });

  // Starting price = lowest non-null price across unit types
  const validPrices = unitPrices.filter(u => u.price).map(u => u.price);
  const computedStartingPrice = validPrices.length > 0 ? Math.min(...validPrices) : startingPrice;

  return {
    id: item.id,
    slug: `${slugify(item.name)}-${item.id}`,
    name: item.name,
    city: board.city,
    region: board.region,
    area,
    lat, lng, address,
    price: startingPrice,
    startingPrice,
    beds: bedrooms,
    bedrooms,
    amenities,
    amen: amenities.map(a => a.toLowerCase()),
    amenitiesList,
    appliancesList,
    inclusionsList,
    photo: photoUrl,
    photoUrl,
    photoGallery,
    isFurnished,
    vacantCount,
    parking: cols[COL.parking] || "",
    parkingInfo: cols[COL.parking] || "",
    pets: cols[COL.pets] || "",
    petPolicy: cols[COL.pets] || "",
    heatingIncl: cols[COL.heating] === "Yes",
    waterIncl: cols[COL.hotwater] === "Yes",
    electricityIncl: cols[COL.electricity] === "Yes",
    internetIncl: cols[COL.internet] === "Yes" || cols[COL.internet] === "Yes in building",
    applicationProcess: cols[COL.appProcess] || "",
    description: subitemDescription || cols[COL.buildingInfo] || cols[COL.apartmentEntry] || "",
    unitPrices,
    subitemPhotosUrl,
    startingPrice: computedStartingPrice,
    statusText,
    tag,
    boardId: board.id,
  };
}

async function fetchBoardItems(board) {
  // Build column IDs to fetch — include the board's specific location column
  const extraCols = board.city === "Toronto" ? Object.values(COL_TORONTO) : [];
  const colsToFetch = [...new Set([...COLUMN_IDS_TO_FETCH, board.locationColId, ...extraCols].filter(Boolean))];

  const query = `
    query ($boardId: [ID!]!, $columnIds: [String!]!, $cursor: String) {
      boards(ids: $boardId) {
        items_page(limit: 500, cursor: $cursor) {
          cursor
          items {
            id
            name
            column_values(ids: $columnIds) { id text value }
            subitems {
              id name
              column_values { id text value type }
            }
          }
        }
      }
    }
  `;
  const allItems = [];
  let cursor = null;
  let pages = 0;
  do {
    const data = await mondayQuery(query, {
      boardId: [String(board.id)],
      columnIds: colsToFetch,
      cursor,
    });
    const page = data?.boards?.[0]?.items_page;
    if (!page) break;
    allItems.push(...(page.items || []));
    cursor = page.cursor;
    pages += 1;
  } while (cursor && pages < 5);
  return allItems;
}

export async function fetchBuildingsFromMonday() {
  if (!process.env.MONDAY_API_KEY) {
    console.log("[Monday] No API key — using mock data");
    return getMockBuildings();
  }
  console.log("[Monday] Fetching buildings from 5 boards...");
  const start = Date.now();
  const allBuildings = [];

  try {
    const results = await Promise.all(
      Object.values(BOARDS).map(async (board) => {
        try {
          const items = await fetchBoardItems(board);
          const parsed = items.map(item => parseBuilding(item, board)).filter(Boolean);
          console.log(`[Monday] ${board.city}: ${parsed.length} active / ${items.length} total`);
          return parsed;
        } catch (err) {
          console.warn(`[Monday] Failed ${board.city}:`, err.message);
          return [];
        }
      })
    );
    results.forEach(arr => allBuildings.push(...arr));
  } catch (err) {
    console.warn("[Monday] Fetch failed:", err.message);
    return getMockBuildings();
  }
  console.log(`[Monday] Done in ${Date.now() - start}ms. Total: ${allBuildings.length} buildings`);
  return allBuildings;
}

export const fetchBuildings = cache(async function fetchBuildings() {
  const redis = getRedis();

  // Try Redis cache first
  if (redis) {
    try {
      const cached = await redis.get(CACHE_KEY);
      if (cached) {
        const data = typeof cached === "string" ? JSON.parse(cached) : cached;
        console.log(`[Cache] HIT — ${data.length} buildings served from Redis`);
        return data;
      }
      console.log("[Cache] MISS — fetching from Monday...");
    } catch (err) {
      console.warn("[Cache] Redis error, falling back to Monday:", err.message);
    }
  }

  // Fetch fresh from Monday
  const buildings = await fetchBuildingsFromMonday();

  // Store in Redis
  if (redis && buildings.length > 0) {
    try {
      await redis.set(CACHE_KEY, JSON.stringify(buildings), { ex: CACHE_TTL });
      console.log(`[Cache] Stored ${buildings.length} buildings in Redis (TTL: ${CACHE_TTL}s)`);
    } catch (err) {
      console.warn("[Cache] Failed to store in Redis:", err.message);
    }
  }

  return buildings;
});

export async function fetchBuildingsByCity(city) {
  const buildings = await fetchBuildings();
  return !city || city === "All cities" ? buildings : buildings.filter(b => b.city === city);
}

export async function fetchBuildingBySlug(slug) {
  const buildings = await fetchBuildings();
  return buildings.find(b => b.slug === slug) || null;
}

export async function fetchCities() {
  return Object.values(BOARDS).map(b => ({ name: b.city, region: b.region }));
}

function getMockBuildings() {
  return [
    { id: "mock-1", slug: "le-750-peel-mock-1", name: "Le 750 Peel",
      city: "Montreal", region: "Quebec", area: "Downtown Montreal",
      lat: 45.5017, lng: -73.5673, address: "750 Rue Peel",
      price: 1850, startingPrice: 1850, beds: [0,1,2], bedrooms: [0,1,2],
      amenities: ["Gym","Rooftop Terrace"], amen: ["gym","rooftop"],
      photo: "", photoUrl: "", tag: "Featured", statusText: "Lease-Up" },
  ];
}

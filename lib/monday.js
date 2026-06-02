import { cache } from "react";

const MONDAY_API_URL = "https://api.monday.com/v2";

// 5 LISTINGS DATABASE BOARDS
export const BOARDS = {
  montreal: { id: 3743206409, name: "Listings Database", city: "Montreal", region: "Quebec",
    locationColId: "location" },
  ottawa: { id: 4955235841, name: "Listings Database - Ottawa", city: "Ottawa", region: "Ontario",
    locationColId: "location" },
  toronto: { id: 18402583974, name: "Listings Database - Toronto", city: "Toronto", region: "Ontario",
    locationColId: "location" }, // Toronto board needs a Location-type column added in Monday
  london: { id: 18401824343, name: "Listings Database - London", city: "London", region: "Ontario",
    locationColId: "location" }, // London board needs a Location-type column added in Monday
  kwcg: { id: 5892819868, name: "Listings Database - K-W-C-G", city: "Kitchener-Waterloo", region: "Ontario",
    locationColId: "location_mm3yr7wf" }, // Different column ID on this board
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

  let tag = null;
  if (statusText === "Lease-Up") tag = "Available now";
  else if (statusText === "Stabilization") tag = "Featured";

  const furnished = cols[COL.furnished] || "";
  const isFurnished = furnished === "Yes" || furnished === "Yes for extra" || furnished === "Some-units only";

  let photoUrl = cols[COL.pictures] || "";
  if (photoUrl.includes("\n")) photoUrl = photoUrl.split("\n")[0].trim();
  if (photoUrl.includes(",")) photoUrl = photoUrl.split(",")[0].trim();
  if (photoUrl && !photoUrl.startsWith("http")) photoUrl = "";

  const vacantCount = parseInt(cols[COL.numVacant], 10) || 0;

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
    photo: photoUrl,
    photoUrl,
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
    description: cols[COL.buildingInfo] || cols[COL.apartmentEntry] || "",
    statusText,
    tag,
    boardId: board.id,
  };
}

async function fetchBoardItems(board) {
  // Build column IDs to fetch — include the board's specific location column
  const colsToFetch = [...new Set([...COLUMN_IDS_TO_FETCH, board.locationColId].filter(Boolean))];

  const query = `
    query ($boardId: [ID!]!, $columnIds: [String!]!, $cursor: String) {
      boards(ids: $boardId) {
        items_page(limit: 500, cursor: $cursor) {
          cursor
          items {
            id
            name
            column_values(ids: $columnIds) { id text value }
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

export const fetchBuildings = cache(async function fetchBuildings() {
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

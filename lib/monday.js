/**
 * Monday.com API integration for RentBolt
 *
 * Fetches building data from 5 regional Monday.com boards
 * ENV VAR REQUIRED: MONDAY_API_KEY
 */

const MONDAY_API_URL = "https://api.monday.com/v2";

const BOARDS = {
  Montreal: { id: 3743206409, city: "Montreal", region: "QC" },
  Ottawa: { id: 4955235841, city: "Ottawa", region: "ON" },
  Toronto: { id: 18402583974, city: "Toronto", region: "ON" },
  London: { id: 18401824343, city: "London", region: "ON" },
  "Kitchener-Waterloo": { id: 5892819868, city: "Kitchener-Waterloo", region: "ON" },
};

const COLUMN_MAP = {
  name: "name",
  photos: "text_mkxvrp7p",
  location: "location",
  bedrooms: "dropdown_mkvpnqth",
  amenities: "dropdown_mkvpebxp",
  parking: "dropdown_mkvp2xa8",
  pets: "dropdown_mkvpaxpe",
  heating: "dropdown_mkvp7ydk",
  electricity: "dropdown_mkvp4zv7",
  hotwater: "dropdown_mkvp1m8y",
  internet: "dropdown_mkvp5qrn",
  furnished: "dropdown_mkvpjqc3",
  status: "status2",
  priceStudio_min: "numeric_mkvpj4tc",
  priceStudio_max: "numeric_mkvpdy1g",
  price1bed_min: "numeric_mkvpxb52",
  price1bed_max: "numeric_mkvpf4d4",
  price2bed_min: "numeric_mkvp1k9p",
  price2bed_max: "numeric_mkvpx6qm",
  price3bed_min: "numeric_mkvpd4ne",
  price3bed_max: "numeric_mkvpftms",
};

async function mondayQuery(query, variables = {}) {
  const apiKey = process.env.MONDAY_API_KEY;
  if (!apiKey) return null;

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) throw new Error(`Monday API error: ${res.status}`);
  const data = await res.json();
  if (data.errors) throw new Error(`Monday query error: ${JSON.stringify(data.errors)}`);
  return data.data;
}

function parseBuilding(item, city, region) {
  const cols = {};
  for (const col of item.column_values) {
    cols[col.id] = col.text || col.value || "";
  }

  // Parse location (lat/lng come as JSON from location column)
  let lat = 0, lng = 0;
  const locStr = cols[COLUMN_MAP.location];
  if (locStr) {
    try {
      const loc = JSON.parse(locStr);
      lat = parseFloat(loc.lat) || 0;
      lng = parseFloat(loc.lng) || 0;
    } catch (e) {
      // Location not parseable
    }
  }

  // Parse bedroom types
  const bedroomStr = cols[COLUMN_MAP.bedrooms] || "";
  let beds = [];
  if (bedroomStr.includes("Studio")) beds.push(0);
  if (bedroomStr.includes("1")) beds.push(1);
  if (bedroomStr.includes("2")) beds.push(2);
  if (bedroomStr.includes("3")) beds.push(3);
  if (bedroomStr.includes("4+")) beds.push(4);

  // Get starting price (lowest available)
  const prices = [
    parseInt(cols[COLUMN_MAP.priceStudio_min], 10),
    parseInt(cols[COLUMN_MAP.price1bed_min], 10),
    parseInt(cols[COLUMN_MAP.price2bed_min], 10),
    parseInt(cols[COLUMN_MAP.price3bed_min], 10),
  ].filter(p => p > 0);
  const startingPrice = prices.length > 0 ? Math.min(...prices) : 0;

  // Parse amenities (dropdown, comma-separated values)
  const amenStr = cols[COLUMN_MAP.amenities] || "";
  const amen = [];
  if (amenStr.includes("Gym")) amen.push("gym");
  if (amenStr.includes("Parking") || amenStr.includes("Outdoor") || amenStr.includes("Indoor")) amen.push("parking");
  if (amenStr.includes("Laundry")) amen.push("laundry");
  if (amenStr.includes("Pet")) amen.push("pet-friendly");

  // Get status tag (Popular, New, Featured)
  const statusStr = cols[COLUMN_MAP.status] || "";
  let tag = null;
  if (statusStr.includes("Popular")) tag = "Popular";
  else if (statusStr.includes("New")) tag = "New";
  else if (statusStr.includes("Featured")) tag = "Featured";

  return {
    id: item.id,
    name: item.name,
    city,
    region,
    lat,
    lng,
    price: startingPrice,
    beds,
    amen,
    photo: cols[COLUMN_MAP.photos] || "",
    tag,
  };
}

export async function fetchBuildings() {
  if (!process.env.MONDAY_API_KEY) {
    console.log("Using mock data (no MONDAY_API_KEY)");
    return getMockBuildings();
  }

  const allBuildings = [];
  const query = `
    query ($boardId: [ID!]!) {
      boards(ids: $boardId) {
        items_page(limit: 500) {
          items {
            id
            name
            column_values { id text value }
          }
        }
      }
    }
  `;

  try {
    for (const [key, board] of Object.entries(BOARDS)) {
      const data = await mondayQuery(query, { boardId: [board.id] });
      const items = data?.boards?.[0]?.items_page?.items || [];
      
      const buildings = items
        .map(item => parseBuilding(item, board.city, board.region))
        .filter(b => b.lat !== 0 && b.lng !== 0 && b.price > 0);
      
      allBuildings.push(...buildings);
    }
  } catch (err) {
    console.warn("Monday.com fetch failed, falling back to mock data:", err.message);
    return getMockBuildings();
  }

  return allBuildings;
}

export async function fetchBuildingsByCity(city) {
  const buildings = await fetchBuildings();
  return city === "All Markets" ? buildings : buildings.filter(b => b.city === city);
}

export async function fetchCities() {
  const buildings = await fetchBuildings();
  const cities = [...new Set(buildings.map(b => b.city))].sort();
  return ["All Markets", ...cities];
}

function getMockBuildings() {
  return [
    {id:"1",name:"Le Griffintown",city:"Montreal",region:"QC",lat:45.4895,lng:-73.5584,price:1450,beds:[0,1,2],amen:["gym","parking","laundry","pet-friendly"],photo:"https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&h=500&fit=crop",tag:"Popular"},
    {id:"2",name:"Verdun Flats",city:"Montreal",region:"QC",lat:45.4572,lng:-73.5711,price:1175,beds:[1,2,3],amen:["laundry","pet-friendly"],photo:"https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop",tag:null},
    {id:"3",name:"The Plateau Collection",city:"Montreal",region:"QC",lat:45.5225,lng:-73.5777,price:1650,beds:[1,2],amen:["laundry"],photo:"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=500&fit=crop",tag:"New"},
    {id:"4",name:"CAPREIT — Parc Laurier",city:"Montreal",region:"QC",lat:45.5311,lng:-73.5949,price:1325,beds:[0,1,2,3],amen:["gym","parking","laundry","pet-friendly"],photo:"https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800&h=500&fit=crop",tag:"Featured"},
    {id:"5",name:"NDG Heritage",city:"Montreal",region:"QC",lat:45.4737,lng:-73.6205,price:1290,beds:[1,2,3],amen:["parking","laundry"],photo:"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=500&fit=crop",tag:null},
    {id:"6",name:"Sugarbush Residences",city:"Kitchener-Waterloo",region:"ON",lat:43.4643,lng:-80.5204,price:1797,beds:[1,2],amen:["gym","parking","laundry"],photo:"https://images.unsplash.com/photo-1567496898669-ee935f5f647a?w=800&h=500&fit=crop",tag:"New"},
    {id:"7",name:"21 Holborn Drive",city:"Kitchener-Waterloo",region:"ON",lat:43.4191,lng:-80.4446,price:2197,beds:[2,3],amen:["parking","laundry","pet-friendly"],photo:"https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&h=500&fit=crop",tag:null},
    {id:"8",name:"75 Old Chicopee",city:"Kitchener-Waterloo",region:"ON",lat:43.4441,lng:-80.4351,price:2347,beds:[2,3],amen:["parking","laundry","gym"],photo:"https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop",tag:"Popular"},
    {id:"9",name:"Gatineau Central",city:"Ottawa",region:"ON",lat:45.4765,lng:-75.7013,price:1195,beds:[0,1,2],amen:["laundry","parking"],photo:"https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop",tag:null},
    {id:"10",name:"Ottawa Overbrook",city:"Ottawa",region:"ON",lat:45.4304,lng:-75.6602,price:1450,beds:[1,2,3],amen:["gym","laundry","parking","pet-friendly"],photo:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",tag:"Featured"},
    {id:"11",name:"London West End",city:"London",region:"ON",lat:42.9849,lng:-81.2783,price:1595,beds:[1,2],amen:["parking","laundry","gym"],photo:"https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&h=500&fit=crop",tag:null},
    {id:"12",name:"Toronto Downtown",city:"Toronto",region:"ON",lat:43.6626,lng:-79.3957,price:1850,beds:[1,2,3],amen:["gym","parking","pet-friendly"],photo:"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop",tag:"Popular"},
  ];
}

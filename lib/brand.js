/* RentBolt brand tokens — single source of truth */

export const brand = {
  navy: "#0A1F5C",
  navyLight: "#1A3278",
  navyDark: "#061440",
  gold: "#C9A84C",
  goldLight: "#E2C87E",
  goldDark: "#A8882E",
  goldSubtle: "#F5EDD4",
  white: "#FFFFFF",
  bg: "#F7F8FA",
  border: "#E8EBF0",
  textPrimary: "#0A1F5C",
  textSecondary: "#5A6278",
  textMuted: "#8B92A5",
};

export const meta = {
  siteName: "RentBolt",
  tagline: "Find your next home",
  description:
    "RentBolt connects renters with verified apartments across Montreal, Ottawa, Kitchener-Waterloo, London, Hamilton, and more. Browse live inventory, book visits, and move in faster.",
  url: "https://www.rentbolt.ca",
  phone: "(438) 793-7514",
  email: "rent@rentbolt.ca",
  addressQC: "227 Galt #320, Montreal, QC H4G 2P3",
  addressON: "111 Peter St #700, Toronto, ON M5V 2H1",
  address: "227 Galt #320, Montreal, QC H4G 2P3",
  calendly: "https://calendly.com/rentwithbolt/discoverycall",
  social: {
    instagram: "https://www.instagram.com/rentbolt/",
    linkedin: "https://ca.linkedin.com/company/rentbolt",
    tiktok: "https://www.tiktok.com/@rentwithbolt",
    facebook: "https://www.facebook.com/rentboltt/",
  },
};

// Markets RentBolt operates in
export const markets = [
  { name: "Montreal", region: "QC", lat: 45.5017, lng: -73.5773, zoom: 12 },
  { name: "Gatineau", region: "QC", lat: 45.4765, lng: -75.7013, zoom: 13 },
  { name: "Ottawa", region: "ON", lat: 45.4304, lng: -75.6602, zoom: 12 },
  { name: "Kitchener", region: "ON", lat: 43.4316, lng: -80.4398, zoom: 12 },
  { name: "Waterloo", region: "ON", lat: 43.4643, lng: -80.5204, zoom: 13 },
  { name: "London", region: "ON", lat: 42.9849, lng: -81.2783, zoom: 13 },
  { name: "Hamilton", region: "ON", lat: 43.2557, lng: -79.8711, zoom: 13 },
];

export const amenityIcons = {
  gym: "🏋️",
  parking: "🅿️",
  laundry: "👕",
  "pet-friendly": "🐾",
  pool: "🏊",
  balcony: "🌇",
  dishwasher: "🍽️",
  ac: "❄️",
  elevator: "🛗",
  concierge: "🛎️",
};

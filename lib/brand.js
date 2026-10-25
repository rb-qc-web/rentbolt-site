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
  // Used as the default meta description on every page, so the cities named
  // here are the ones Google most strongly associates with the site. It listed
  // Hamilton, where there is no inventory, and omitted Toronto, which is both
  // the largest market and the most valuable search term we have.
  description:
    "Apartments for rent across Montreal, Toronto, Ottawa, Mississauga, London and Kitchener-Waterloo. Browse live availability and book a visit — no cost to renters.",
  url: "https://www.rentbolt.ca",
  phone: "(438) 793-7514",
  // Two addresses, two jobs. hello@ is what the site shows the public; rent@
  // is where leads are handled and is not advertised, so the two can be routed
  // differently without the footers having to know.
  email: "rent@rentbolt.ca",
  emailPublic: "hello@rentbolt.ca",
  addressQC: "227 Galt #320, Montreal, QC H4G 2P3",
  addressON: "2482 Yonge St, Unit #2, Toronto, ON M4P 2H5",
  address: "227 Galt #320, Montreal, QC H4G 2P3",
  calendly: "https://calendly.com/rentwithbolt/discoverycall",
  social: {
    instagram: "https://www.instagram.com/rentbolt/",
    linkedin: "https://ca.linkedin.com/company/rentbolt",
    tiktok: "https://www.tiktok.com/@rentwithbolt",
    facebook: "https://www.facebook.com/rentboltt/",
  },
};

// Re-exported from the one city list so this cannot drift from it again.
export { MARKETS as markets } from "./cityContent";

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

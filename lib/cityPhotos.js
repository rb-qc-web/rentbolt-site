// City fallback photos — used when a building has no photo in Monday
// All from Unsplash, free to use, sized for performance

export const CITY_PHOTOS = {
  "Montreal":           "https://images.unsplash.com/photo-1519178614-68673b201f36?w=1200&h=800&fit=crop&q=80",
  "Montréal":           "https://images.unsplash.com/photo-1519178614-68673b201f36?w=1200&h=800&fit=crop&q=80",
  "Toronto":            "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  "Ottawa":             "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1200&h=800&fit=crop&q=80",
  "Gatineau":           "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80",
  "London":             "https://images.unsplash.com/photo-1572125675722-238a4f1f8ea3?w=1200&h=800&fit=crop&q=80",
  "Kitchener-Waterloo": "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=1200&h=800&fit=crop&q=80",
  "Hamilton":           "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=800&fit=crop&q=80",
};

export const FALLBACK_IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&q=80";

export function getBuildingPhoto(building) {
  if (building?.photo && building.photo.startsWith("http") && !building.photo.includes("drive.google")) {
    return building.photo;
  }
  return CITY_PHOTOS[building?.city] || FALLBACK_IMG;
}

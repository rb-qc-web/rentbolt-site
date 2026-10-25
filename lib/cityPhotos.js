// City fallback photos — used when a building has no photo in Monday
// All from Unsplash, free to use, sized for performance

export const CITY_PHOTOS = {
  "Montreal":           "https://images.unsplash.com/photo-1519178614-68673b201f36?w=1200&h=800&fit=crop&q=80",
  "Montréal":           "https://images.unsplash.com/photo-1519178614-68673b201f36?w=1200&h=800&fit=crop&q=80",
  "Toronto":            "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  // Mississauga and Ajax reuse the Toronto skyline rather than an unverified
  // Unsplash id — both are GTA, and a broken image is worse than a generic one.
  // Swap for real local photography when there is some.
  "Mississauga":        "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  "Ajax":               "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  "Ottawa":             "https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=1200&h=800&fit=crop&q=80",
  "Gatineau":           "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=800&fit=crop&q=80",
  // Real photo of London, Ontario — the Thames and the downtown skyline.
  // Self-hosted rather than an Unsplash id: the previous id 404'd, which is how
  // the card ended up showing broken-image alt text. Files in /public cannot
  // vanish on someone else's service.
  "London":             "/cities/london.jpg",
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
// force redeploy Wed Jun  3 03:35:24 UTC 2026

// City fallback photos — used when a building has no photo in Monday
// All from Unsplash, free to use, sized for performance

export const CITY_PHOTOS = {
  // Old Port and the downtown skyline. Both spellings point at the same file:
  // building.city holds "Montreal", while the UI writes "Montréal".
  "Montreal":           "/cities/montreal.jpg",
  "Montréal":           "/cities/montreal.jpg",
  "Toronto":            "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  // Mississauga and Ajax reuse the Toronto skyline rather than an unverified
  // Unsplash id — both are GTA, and a broken image is worse than a generic one.
  // Swap for real local photography when there is some.
  "Mississauga":        "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  "Ajax":               "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&h=800&fit=crop&q=80",
  // Parliament Hill. Self-hosted for the same reason as London: the previous
  // Unsplash id here was a Toronto skyline.
  "Ottawa":             "/cities/ottawa.jpg",
  // Real photo of London, Ontario — the Thames and the downtown skyline.
  // Self-hosted rather than an Unsplash id: the previous id 404'd, which is how
  // the card ended up showing broken-image alt text. Files in /public cannot
  // vanish on someone else's service.
  "London":             "/cities/london.jpg",
  // King Street, Kitchener, with the ION light rail — which the city page's
  // copy also mentions. Replaces an Unsplash id that was serving a kitchen.
  "Kitchener-Waterloo": "/cities/kitchener-waterloo.jpg",
};

export const FALLBACK_IMG = "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=1200&h=800&fit=crop&q=80";

export function getBuildingPhoto(building) {
  if (building?.photo && building.photo.startsWith("http") && !building.photo.includes("drive.google")) {
    return building.photo;
  }
  return CITY_PHOTOS[building?.city] || FALLBACK_IMG;
}
// force redeploy Wed Jun  3 03:35:24 UTC 2026

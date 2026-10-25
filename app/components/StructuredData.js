import { meta } from "@/lib/brand";
import { CITY_PAGES } from "@/lib/cityContent";

// Structured data (schema.org JSON-LD). This is what lets Google show a price,
// bedroom count and location inside the search result itself rather than a bare
// blue link — on ~700 listing pages.
//
// COMPETITIVE PROTECTION APPLIES HERE TOO. Everything below is built from the
// same public-safe fields the page renders: street-level name, city,
// neighbourhood. No civic address, no landlord building name. Structured data
// is machine-readable and gets scraped far more reliably than page text, so a
// leak here would be worse than one in the HTML, not better.
//
// Coordinates are deliberately absent. The ones we hold are fuzzed by 150–300m
// on purpose; publishing them as geo data would be asserting a location we know
// to be wrong.

const citySlug = (city) => CITY_PAGES.find(c => c.city === city)?.slug || null;

function Ld({ data }) {
  return (
    <script
      type="application/ld+json"
      // The content is our own, built from our own fields — no user input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** Sitewide: who RentBolt is, for the knowledge panel and brand searches. */
export function OrganizationLd() {
  return (
    <Ld
      data={{
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        name: meta.siteName,
        url: meta.url,
        logo: `${meta.url}/icon.svg`,
        email: meta.emailPublic,   // the public address, not the leads one
        telephone: meta.phone,
        areaServed: [
          "Montreal", "Ottawa", "Toronto", "Mississauga",
          "Ajax", "London", "Kitchener-Waterloo",
        ].map(name => ({ "@type": "City", name })),
      }}
    />
  );
}

/** One listing. */
export function BuildingLd({ building }) {
  const name = building.publicName || building.name;
  const beds = (building.bedrooms || []).filter(n => n > 0);

  const data = {
    "@context": "https://schema.org",
    "@type": "Residence",
    name,
    url: `${meta.url}/buildings/${building.slug}`,
    address: {
      "@type": "PostalAddress",
      // Locality only — no streetAddress. See the note at the top of the file.
      addressLocality: building.city,
      addressRegion: building.region === "Quebec" ? "QC" : "ON",
      addressCountry: "CA",
    },
  };

  if (building.neighbourhood) {
    data.containedInPlace = { "@type": "Place", name: building.neighbourhood };
  }

  const photos = (building.photoGallery || []).filter(Boolean).slice(0, 6);
  if (photos.length) data.photo = photos;
  else if (building.photoUrl) data.photo = [building.photoUrl];

  if (beds.length) {
    data.numberOfBedrooms = Math.min(...beds);
  }

  const amenities = [
    ...(building.amenitiesList || []),
    ...(building.amenities || []),
  ].filter(Boolean).slice(0, 15);
  if (amenities.length) {
    data.amenityFeature = amenities.map(a => ({
      "@type": "LocationFeatureSpecification",
      name: a,
      value: true,
    }));
  }

  // Only claim a price when there is one. A listing with no pricing yet says
  // nothing rather than claiming $0.
  if (building.startingPrice > 0) {
    data.makesOffer = {
      "@type": "Offer",
      price: building.startingPrice,
      priceCurrency: "CAD",
      availability: "https://schema.org/InStock",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: building.startingPrice,
        priceCurrency: "CAD",
        unitCode: "MON",          // per month
        referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: "MON" },
      },
    };
  }

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: meta.url },
      // Points at the city landing page rather than a filtered search URL:
      // that page is the one meant to rank, and breadcrumbs are an internal
      // link from all ~700 listings to it.
      { "@type": "ListItem", position: 2, name: `Apartments in ${building.city}`,
        item: citySlug(building.city)
          ? `${meta.url}/apartments/${citySlug(building.city)}`
          : `${meta.url}/search?city=${encodeURIComponent(building.city)}` },
      { "@type": "ListItem", position: 3, name },
    ],
  };

  return (
    <>
      <Ld data={data} />
      <Ld data={crumbs} />
    </>
  );
}

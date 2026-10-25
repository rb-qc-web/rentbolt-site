import { meta } from "@/lib/brand";

// FAQPage is the one schema here with a direct, visible payoff: Google can
// expand the questions underneath the result, which takes up more of the page
// than the competing links.
//
// The questions and answers must match what the page actually renders —
// marking up text a visitor cannot see is a manual-action risk, so both read
// from the same source.
export function CityLd({ page, buildings, from }) {
  const url = `${meta.url}/apartments/${page.slug}`;

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: page.faqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const crumbs = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: meta.url },
      { "@type": "ListItem", position: 2, name: `Apartments in ${page.display}`, item: url },
    ],
  };

  // Listing identity stays public-safe here exactly as it does on the detail
  // pages: street-level name and city only, no civic address, no coordinates.
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Apartments for rent in ${page.display}`,
    numberOfItems: buildings.length,
    itemListElement: buildings.slice(0, 25).map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${meta.url}/buildings/${b.slug}`,
      name: b.publicName || b.name,
    })),
  };

  const collection = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: page.headline,
    url,
    about: { "@type": "City", name: page.display },
    ...(from
      ? {
          offers: {
            "@type": "AggregateOffer",
            lowPrice: from,
            priceCurrency: "CAD",
            offerCount: buildings.length,
          },
        }
      : {}),
  };

  return (
    <>
      {[faq, crumbs, list, collection].map((d, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }}
        />
      ))}
    </>
  );
}

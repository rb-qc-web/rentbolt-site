import { fetchBuildings } from "@/lib/monday";
import { meta } from "@/lib/brand";

// robots.txt has pointed crawlers at /sitemap.xml since launch, but no sitemap
// existed — every crawler that asked got a 404. With ~700 listings, this is the
// difference between Google finding them and Google finding the home page.
//
// Rebuilt hourly rather than at build time, so a newly leased building drops
// out and a new one appears without a deploy.
export const revalidate = 3600;

export default async function sitemap() {
  const now = new Date();

  // No lastModified on listings on purpose. Monday is not queried for
  // updated_at — adding it means a heavier query, and query weight is what took
  // the Montreal board down. A date we cannot stand behind is worse than none:
  // claiming everything changed on every crawl teaches Google to ignore the
  // signal entirely.
  const pages = [
    { url: meta.url,                      lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${meta.url}/search`,          lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${meta.url}/find-a-place`,    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${meta.url}/landlords`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${meta.url}/contact`,         lastModified: now, changeFrequency: "yearly",  priority: 0.4 },
  ];

  // /saved and /admin are deliberately absent: one is personal to the visitor
  // and identical for everyone who has saved nothing, the other is private.
  try {
    const buildings = await fetchBuildings();
    for (const b of buildings) {
      if (!b?.slug) continue;
      pages.push({
        url: `${meta.url}/buildings/${b.slug}`,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }
  } catch (err) {
    // A sitemap listing the five static pages still beats a 404, so a Monday or
    // Redis failure must not take the whole file down with it.
    console.error("[sitemap] could not load buildings:", err.message);
  }

  return pages;
}

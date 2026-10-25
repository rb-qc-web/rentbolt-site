import { notFound } from "next/navigation";
import { fetchBuildings } from "@/lib/monday";
import { meta } from "@/lib/brand";
import { getBuildingPhoto } from "@/lib/cityPhotos";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import FavouriteButton from "@/app/components/FavouriteButton";
import { CITY_PAGES, getCityPage, knowBlocksFor } from "@/lib/cityContent";
import { CityLd } from "./CityLd";
import "./city.css";

// A real page per city, which /search?city=X could never be: that URL is the
// same document with a filter — same title, same text — so Google collapses
// seven markets into one page and the site ranks for none of
// "apartments for rent in <city>".
//
// Server-rendered on purpose. The copy has to be in the HTML a crawler
// receives, not assembled after hydration.
export const revalidate = 3600;

export function generateStaticParams() {
  return CITY_PAGES.map(c => ({ city: c.slug }));
}

export async function generateMetadata({ params }) {
  const page = getCityPage(params.city);
  if (!page) return {};

  const buildings = await cityBuildings(page.city);
  const from = lowestPrice(buildings);

  // The description carries a real figure where there is one — a count and a
  // price are what make a result worth clicking over six identical ones.
  const n = buildings.length;
  const noun = `${n} apartment building${n === 1 ? "" : "s"}`;
  const desc = from
    ? `${noun} for rent in ${page.display}, from $${from.toLocaleString()}/month. Browse availability and book a viewing with a local RentBolt advisor. No fee for renters.`
    : `Apartment buildings for rent in ${page.display}. Browse availability and book a viewing with a local RentBolt advisor. No fee for renters.`;

  return {
    title: `${page.headline} — Available Now`,
    description: desc,
    alternates: { canonical: `${meta.url}/apartments/${page.slug}` },
    openGraph: {
      title: `${page.headline} | RentBolt`,
      description: desc,
      url: `${meta.url}/apartments/${page.slug}`,
      type: "website",
    },
  };
}

async function cityBuildings(city) {
  try {
    const all = await fetchBuildings();
    return all.filter(b => b.city === city);
  } catch {
    return [];
  }
}

const lowestPrice = (list) => {
  const p = list.map(b => Number(b.startingPrice)).filter(n => n > 0);
  return p.length ? Math.min(...p) : null;
};

export default async function CityPage({ params }) {
  const page = getCityPage(params.city);
  if (!page) notFound();

  const buildings = await cityBuildings(page.city);
  const from = lowestPrice(buildings);

  // Every figure on this page is read from the live listings rather than
  // written into the copy, so the page cannot quietly go stale.
  const neighbourhoods = [...new Set(buildings.map(b => b.neighbourhood).filter(Boolean))].sort();
  const bedSet = [...new Set(buildings.flatMap(b => b.bedrooms || []))].sort((a, b) => a - b);
  const featured = [...buildings]
    .sort((a, b) => (b.photoGallery?.length || 0) - (a.photoGallery?.length || 0))
    .slice(0, 12);

  const searchHref = `/search?city=${encodeURIComponent(page.city)}`;
  const know = knowBlocksFor(page);

  return (
    <>
      <CityLd page={page} buildings={buildings} from={from} />
      <SiteHeader />

      <main className="ct-wrap">
        <nav className="ct-crumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span aria-hidden="true">›</span>
          <span>{page.display}</span>
        </nav>

        <header className="ct-hero">
          <h1>{page.headline}</h1>
          <p className="ct-blurb">{page.blurb}</p>

          <div className="ct-stats">
            <div>
              <strong>{buildings.length}</strong>
              <span>building{buildings.length === 1 ? "" : "s"} listed</span>
            </div>
            {from && (
              <div>
                <strong>${from.toLocaleString()}</strong>
                <span>starting rent</span>
              </div>
            )}
            {neighbourhoods.length > 0 && (
              <div>
                <strong>{neighbourhoods.length}</strong>
                <span>neighbourhood{neighbourhoods.length === 1 ? "" : "s"}</span>
              </div>
            )}
            <div>
              <strong>$0</strong>
              <span>cost to renters</span>
            </div>
          </div>

          <a className="ct-cta" href={searchHref}>
            See all {page.display} listings on the map →
          </a>
        </header>

        <section className="ct-intro">
          {page.intro.map((para, i) => <p key={i}>{para}</p>)}
        </section>

        {featured.length > 0 && (
          <section className="ct-section">
            <h2>Available buildings in {page.display}</h2>
            <div className="ct-grid">
              {featured.map(b => (
                <a key={b.id} className="ct-card" href={`/buildings/${b.slug}`}>
                  <div className="ct-card-photo">
                    <img src={getBuildingPhoto(b)} alt={`${b.publicName || b.name}, ${b.city}`} loading="lazy" />
                    <FavouriteButton id={b.id} className="ct-card-fav" />
                  </div>
                  <div className="ct-card-body">
                    {b.neighbourhood && <p className="ct-card-hood">{b.neighbourhood}</p>}
                    <h3>{b.publicName || b.name}</h3>
                    {b.bedrooms?.length > 0 && (
                      <p className="ct-card-beds">
                        {b.bedrooms.map(n => (n === 0 ? "Studio" : `${n}BR`)).join(" · ")}
                      </p>
                    )}
                    <p className="ct-card-price">
                      {b.startingPrice > 0
                        ? `from $${Number(b.startingPrice).toLocaleString()}/mo`
                        : "Contact us for pricing"}
                    </p>
                  </div>
                </a>
              ))}
            </div>
            {buildings.length > featured.length && (
              <a className="ct-more" href={searchHref}>
                View all {buildings.length} buildings in {page.display} →
              </a>
            )}
          </section>
        )}

        {neighbourhoods.length > 0 && (
          <section className="ct-section">
            <h2>Neighbourhoods we cover in {page.display}</h2>
            <p className="ct-lead">
              Each links straight through to what is available there right now.
            </p>
            <ul className="ct-hoods">
              {neighbourhoods.map(h => (
                <li key={h}>
                  <a href={`${searchHref}&hood=${encodeURIComponent(h)}`}>{h}</a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {bedSet.length > 0 && (
          <section className="ct-section">
            <h2>Browse {page.display} apartments by size</h2>
            <ul className="ct-beds">
              {bedSet.map(n => (
                <li key={n}>
                  <a href={`${searchHref}&beds=${n === 0 ? 0 : Math.min(n, 3)}`}>
                    {n === 0 ? "Studio" : n >= 3 ? "3+ bedroom" : `${n} bedroom`} apartments in {page.display}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="ct-section">
          <h2>What to know about renting in {page.province === "Quebec" ? page.display : "Ontario"}</h2>
          <div className="ct-know">
            {know.map(k => (
              <div key={k.h}>
                <h3>{k.h}</h3>
                <p>{k.p}</p>
              </div>
            ))}
          </div>
          <p className="ct-note">
            General guidance, not legal advice — rules change, and your lease governs.
          </p>
        </section>

        <section className="ct-section">
          <h2>Common questions</h2>
          <div className="ct-faq">
            {page.faqs.map(f => (
              <details key={f.q}>
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <section className="ct-end">
          <h2>Not seeing the right place?</h2>
          <p>
            We have more in {page.display} than we list publicly. Tell us what you need
            and a local advisor will go and find it.
          </p>
          <a className="ct-cta" href="/find-a-place">Tell us what you&rsquo;re looking for →</a>
        </section>

        <nav className="ct-other" aria-label="Other cities">
          <h2>Apartments in other cities</h2>
          <ul>
            {CITY_PAGES.filter(c => c.slug !== page.slug).map(c => (
              <li key={c.slug}>
                <a href={`/apartments/${c.slug}`}>Apartments for rent in {c.display}</a>
              </li>
            ))}
          </ul>
        </nav>
      </main>

      <SiteFooter />
    </>
  );
}

// Editorial copy for the city landing pages.
//
// WHY THIS FILE EXISTS: /search?city=Montreal is the same page as every other
// city — same title, same text, one URL. Google sees one page, so the site
// ranks for none of "apartments for rent in <city>", which is the search that
// actually brings tenants. A real page per city, with its own words, is what
// competes.
//
// WHAT IS SAFE TO PUT HERE: durable facts only. Tenancy rules, neighbourhood
// names, transit, universities — things that stay true for years. Everything
// numeric (how many buildings, what they cost, which neighbourhoods have
// inventory) is read from the live listings at render time instead of being
// written down here, so the pages cannot drift out of date the way hardcoded
// figures would.
//
// Deliberately NOT here: average market rents, vacancy rates, "cheapest
// neighbourhood" claims. Those change every year, and a confidently wrong
// number on a page meant to establish authority does more harm than a page
// without it.
//
// Omar should read this through — it is his market, and the tone should be his.

export const CITY_PAGES = [
  {
    slug: "montreal",
    region: "QC",
    tier: "Flagship",
    city: "Montreal",            // must match the `city` on parsed buildings
    display: "Montréal",
    province: "Quebec",
    headline: "Apartments for Rent in Montréal",
    blurb:
      "Browse available apartments across Montréal with a RentBolt leasing advisor who knows the building, not just the listing.",
    intro: [
      "Montréal rents differently from the rest of Canada. Most leases run from July 1st to June 30th, which is why the whole city seems to move on the same weekend — and why the best apartments are spoken for months before that date. Searching in April for a July move is normal here; searching in June is late.",
      "RentBolt works directly with the owners and managers of the buildings below, so our advisors can tell you what a listing photo cannot: which units actually face the courtyard, what the building is like in February, and whether the unit you want is likely to come up again this season.",
    ],
    // Renting rules that genuinely differ from Ontario — the useful part.
    knowBlocks: [
      {
        h: "Leases, and the July 1st cycle",
        p: "A standard Québec lease is twelve months, usually July 1st to June 30th, and it renews automatically unless proper notice is given. Notice periods are set by law rather than by the landlord, so a lease that ends in June typically needs notice months in advance.",
      },
      {
        h: "Deposits work differently here",
        p: "In Québec a landlord may ask for the first month's rent, and that is it. Security deposits, damage deposits and last month's rent are not permitted the way they are in Ontario. If you are moving from another province, budget for one month, not two or three.",
      },
      {
        h: "Clause G and what the last tenant paid",
        p: "Québec leases include a section where the landlord states the lowest rent paid in the previous twelve months. It is worth reading before you sign — it tells you how much the rent has moved, and you have a limited window after signing to contest an increase.",
      },
      {
        h: "Lease transfers",
        p: "Transferring a lease — a cession de bail — is common in Montréal and is a legitimate way to take over a good apartment mid-cycle. A landlord can refuse only for a serious reason.",
      },
    ],
    faqs: [
      {
        q: "When should I start looking for an apartment in Montréal?",
        a: "For a July 1st move, start in March or April. Most Québec leases end June 30th, so the bulk of inventory is listed in spring and the best units go early. Outside that cycle, availability is thinner but still real — our advisors can tell you what is actually coming up.",
      },
      {
        q: "Do I need a security deposit to rent in Montréal?",
        a: "No. In Québec a landlord may collect the first month's rent and nothing more. Security deposits, damage deposits and last month's rent are not permitted.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters — we are paid by the building owners and managers we represent.",
      },
      {
        q: "Can I rent in Montréal without a Québec credit history?",
        a: "Often yes. Newcomers and students regularly rent here. Requirements vary by building, and an advisor can point you to the ones used to working with international applicants.",
      },
      {
        q: "What areas of Montréal does RentBolt cover?",
        a: "We work across the island and the surrounding areas, including downtown and Ville-Marie, Plateau-Mont-Royal, Rosemont, Villeray, Ahuntsic-Cartierville, NDG and Côte-des-Neiges, Verdun, Griffintown and the West Island.",
      },
    ],
  },

  {
    slug: "ottawa",
    region: "ON",
    tier: "Active",
    city: "Ottawa",
    display: "Ottawa",
    province: "Ontario",
    headline: "Apartments for Rent in Ottawa",
    blurb:
      "Available apartments across Ottawa, from Centretown to the suburbs, with a leasing advisor who knows each building.",
    intro: [
      "Ottawa's rental market moves with the public service, two large universities and a steady tech sector, which means demand is less seasonal than most Canadian cities — but it still peaks in late summer when students arrive.",
      "RentBolt represents the buildings below directly. That means an advisor can tell you which units are genuinely available, what the commute downtown really looks like, and what a building is like to live in rather than to tour.",
    ],
    knowBlocks: null,            // Ontario blocks are shared, see ONTARIO_KNOW
    faqs: [
      {
        q: "What is the best area to rent in Ottawa?",
        a: "It depends on your commute. Centretown and Sandy Hill put you walking distance from downtown and the universities. Westboro and Hintonburg trade a little distance for more space and a stronger high street. Our advisors will narrow it to the buildings that fit.",
      },
      {
        q: "When is the busiest time to rent in Ottawa?",
        a: "Late summer, as students arrive for September at uOttawa, Carleton and Algonquin. If you are moving then, start looking in spring.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters — the building owners and managers we represent pay us.",
      },
    ],
  },

  {
    slug: "toronto",
    region: "ON",
    tier: "Active",
    city: "Toronto",
    display: "Toronto",
    province: "Ontario",
    headline: "Apartments for Rent in Toronto",
    blurb:
      "Apartments across Toronto with a RentBolt advisor who works directly with the buildings, not a listing aggregator.",
    intro: [
      "Toronto is the most competitive rental market in the country, and good units are often gone within days of listing. Being early matters more here than anywhere else we operate, and so does having someone who hears about a unit before it is advertised.",
      "The buildings below are ones RentBolt represents directly. An advisor can arrange a viewing quickly, tell you what the application actually requires, and be honest about whether you are a realistic candidate for a given building before you spend a week on it.",
    ],
    knowBlocks: null,
    faqs: [
      {
        q: "How fast do apartments go in Toronto?",
        a: "Quickly. Desirable units are frequently leased within days. Having your documents ready before you view — identification, proof of income and references — is the single biggest advantage you can give yourself.",
      },
      {
        q: "What do I need to apply for an apartment in Toronto?",
        a: "Typically photo identification, proof of income such as recent pay stubs or an employment letter, and references from a previous landlord. Requirements vary by building, and an advisor will tell you what a specific one expects.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters.",
      },
    ],
  },

  {
    slug: "mississauga",
    region: "ON",
    tier: "Growing",
    city: "Mississauga",
    display: "Mississauga",
    province: "Ontario",
    headline: "Apartments for Rent in Mississauga",
    blurb:
      "Apartments in Mississauga, from City Centre to the lakeshore, with an advisor who knows the buildings directly.",
    intro: [
      "Mississauga appeals to renters who want more space than downtown Toronto offers without giving up the commute — GO Transit reaches Union Station in well under an hour from several stations, and MiWay covers the city itself.",
      "RentBolt works directly with the buildings below. An advisor can tell you which ones suit a Toronto commute, which are better for families, and what is genuinely available now rather than what is still listed online.",
    ],
    knowBlocks: null,
    faqs: [
      {
        q: "Is Mississauga cheaper than Toronto to rent?",
        a: "Generally renters find more space for the money than in downtown Toronto, though the gap varies by building and by how close you are to a GO station. An advisor can compare specific buildings with you.",
      },
      {
        q: "How long is the commute from Mississauga to downtown Toronto?",
        a: "By GO Train from the Lakeshore West line it is roughly half an hour to Union Station, depending on the station and time of day. Driving varies far more with traffic.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters.",
      },
    ],
  },

  {
    slug: "ajax",
    region: "ON",
    tier: "Growing",
    city: "Ajax",
    display: "Ajax",
    province: "Ontario",
    headline: "Apartments for Rent in Ajax",
    blurb:
      "Apartments in Ajax and Durham Region, with a RentBolt advisor who works directly with each building.",
    intro: [
      "Ajax sits on Lake Ontario in Durham Region, east of Toronto, with GO Train service on the Lakeshore East line into Union Station. It draws renters who want newer buildings and more room than the city centre allows, while keeping a direct train to work.",
      "The buildings below are ones RentBolt represents directly, so an advisor can arrange a viewing and tell you what is actually available rather than what is still showing online.",
    ],
    knowBlocks: null,
    faqs: [
      {
        q: "How do I get from Ajax to Toronto?",
        a: "Ajax is on the GO Train's Lakeshore East line with direct service to Union Station, and Highway 401 runs through the region for drivers.",
      },
      {
        q: "Is Ajax a good place to rent?",
        a: "It suits renters who want newer buildings, more space and a straightforward train commute into Toronto. Inventory is smaller than in the city, so the right unit is worth moving on.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters.",
      },
    ],
  },

  {
    slug: "london",
    region: "ON",
    tier: "Active",
    city: "London",
    display: "London",
    province: "Ontario",
    headline: "Apartments for Rent in London, Ontario",
    blurb:
      "Apartments across London, Ontario, with a leasing advisor who knows each building directly.",
    intro: [
      "London's rental market is shaped by Western University and Fanshawe College, which means a pronounced cycle around September and genuine competition for well-located units in late summer.",
      "RentBolt represents the buildings below directly. An advisor can tell you which are realistic for a student budget, which suit families or professionals, and what is actually available for your move date.",
    ],
    knowBlocks: null,
    faqs: [
      {
        q: "When should I look for an apartment in London, Ontario?",
        a: "If you are moving for September, start in spring. Student demand around Western and Fanshawe tightens the market considerably through the summer.",
      },
      {
        q: "Are there apartments in London suitable for students?",
        a: "Yes, and many buildings are used to student applications and guarantors. An advisor can point you to the ones near campus and transit.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters.",
      },
    ],
  },

  {
    slug: "kitchener-waterloo",
    region: "ON",
    tier: "Active",
    city: "Kitchener-Waterloo",
    display: "Kitchener–Waterloo",
    province: "Ontario",
    headline: "Apartments for Rent in Kitchener–Waterloo",
    blurb:
      "Apartments across Kitchener, Waterloo and Cambridge, with an advisor who works directly with the buildings.",
    intro: [
      "Kitchener–Waterloo combines a substantial tech sector with two universities, which makes for steady year-round demand and a sharp spike each time a co-op term turns over. The ION light rail has also concentrated newer buildings along its route.",
      "RentBolt works directly with the buildings below, so an advisor can tell you what is genuinely available, what suits a four-month co-op term, and which buildings are worth the walk to the LRT.",
    ],
    knowBlocks: null,
    faqs: [
      {
        q: "Can I rent for a four-month co-op term in Kitchener–Waterloo?",
        a: "Some buildings accommodate shorter terms and sublets, though most leases are twelve months. Tell an advisor your dates and they will focus on the buildings that can work with them.",
      },
      {
        q: "Is Waterloo or Kitchener better for renting?",
        a: "Waterloo sits closer to the universities, Kitchener's downtown has more of the newer purpose-built rental stock, and the ION light rail connects them. The right answer depends on your commute.",
      },
      {
        q: "Does RentBolt charge tenants a fee?",
        a: "No. Our service is free for renters.",
      },
    ],
  },
];

// Shared across the Ontario cities — the rules are provincial, so repeating
// them per city would be duplicate content across six pages, which is exactly
// what these pages exist to avoid.
export const ONTARIO_KNOW = [
  {
    h: "The standard lease",
    p: "Most private residential tenancies in Ontario must use the province's standard lease form. If a landlord asks you to sign something else, that is worth questioning before you sign.",
  },
  {
    h: "Deposits",
    p: "A landlord may collect a rent deposit of up to one month, applied to your last month of tenancy, plus a key deposit covering the actual cost of replacement. A separate damage deposit is not permitted.",
  },
  {
    h: "Rent increases",
    p: "For most units, rent may be raised once every twelve months with proper written notice, and the amount is capped by a guideline the province sets each year. Some newer buildings are exempt from the guideline, so it is worth asking which applies.",
  },
  {
    h: "If something goes wrong",
    p: "Disputes between landlords and tenants in Ontario go to the Landlord and Tenant Board rather than the courts.",
  },
];

export const getCityPage = (slug) =>
  CITY_PAGES.find(c => c.slug === String(slug || "").toLowerCase()) || null;

export const knowBlocksFor = (page) => page.knowBlocks || ONTARIO_KNOW;

// ---------------------------------------------------------------------------
// THE city list. Every dropdown, filter, footer and markets panel reads from
// here.
//
// Before this existed the same list was hardcoded in seven files and they had
// drifted apart: the landlords page pitched six markets without Toronto, the
// tenant forms offered Gatineau and Hamilton where there is no inventory, and
// the homepage offered cities whose search returned nothing. A city is in the
// product when it has a board behind it, and that is decided in one place.
// ---------------------------------------------------------------------------

/** Data values — these match `building.city`, so filters compare against them. */
export const CITY_NAMES = CITY_PAGES.map(c => c.city);

/** Display labels for UI — accented and em-dashed where the data value is not. */
export const CITY_LABELS = CITY_PAGES.map(c => c.display);

/** For the markets panel and the footer. */
export const MARKETS = CITY_PAGES.map(c => ({
  city: c.display,
  name: c.display,
  region: c.region,
  tag: `${c.region} — ${c.tier}`,
  slug: c.slug,
}));

export const marketsIn = (region) => MARKETS.filter(m => m.region === region);

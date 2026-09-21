# RentBolt website

Next.js 14 site for RentBolt, deployed on Vercel. Listing data lives in
monday.com; the site reads it, caches it in Redis, and renders it.

- **Live:** https://rentbolt-site.vercel.app
- **Repo:** github.com/rb-qc-web/rentbolt-site

---

## How data flows

```
monday.com  ──►  lib/monday.js  ──►  Upstash Redis  ──►  pages
 (5 boards)      parse + shape       15 min cache
                                     cron every 10 min
```

Nothing writes back to monday.com. Two things live **outside** monday:

| Data | Where | Why |
|---|---|---|
| Photo galleries | Redis `rentbolt:gallery:<buildingId>` | monday subitem boards don't reliably have the column we need (`InvalidColumnIdException`). Redis has no schema to fight. |
| Saved-list leads | Redis `rentbolt:lead:<id>` + `rentbolt:leads` | Redis was already provisioned. Migrate to monday when the other lead forms are wired. |

Everything else — pricing, status, amenities, descriptions — is monday only.
Edit there and it appears on the site within ~10 minutes.

---

## The single biggest gotcha

**monday.com generates a unique column id per board.** `lib/monday.js` has one
`COL` map built from **Montreal** column ids and applies it to all five boards.
Any field in that map silently reads as empty on the other four — no error, no
warning, just missing data that surfaces weeks later as "the filter doesn't
work in Toronto".

This has caused at least four separate bugs: location columns, amenities /
inclusions / appliances, `unitsAvail` (which emptied the bed filters
everywhere but Montreal), and the promo column.

**Before debugging anything that looks like missing data, run
`/api/debug-columns`.** It lists, per board, every expected column that
doesn't exist there and suggests same-type replacements.

Two fields already work around this:

- **Bedrooms** are derived from unit-type subitem names (`"2 Bed"`, `"Studio"`)
  as well as the dropdown, so they work on every board.
- **Neighbourhoods** come from point-in-polygon on coordinates, not from
  monday's area dropdown.

---

## Boards

| City | Board ID | Location column |
|---|---|---|
| Montreal | 3743206409 | `location` |
| Ottawa | 4955235841 | `location` |
| Toronto | 18402583974 | `location_mm3yrv60` |
| London | 18401824343 | `location_mm5eg13x` |
| Kitchener-Waterloo | 5892819868 | `location_mm3yr7wf` |

Only items with status **Lease-Up** or **Stabilization** are published.

---

## Competitive protection

Building identity is stripped **server-side in `parseBuilding`**, before
anything reaches the browser. Masking at render time is not enough — the data
also sits in the JSON payload, the URL slug and the page metadata.

- **Public name** is street name only + "Apartments"
  (`1445 Rue du Fort` → `Rue du Fort Apartments`)
- **Slug** is built from the public name, not the monday item name
- **Coordinates** are fuzzed 150–300m, deterministic per building id so a pin
  never moves between page loads
- The landlord's building name never reaches the client

`lib/publicName.js` honours a `publicNameOverride` field if a "Public Name"
column is ever added in monday.

---

## Environment variables

| Variable | Used for |
|---|---|
| `MONDAY_API_KEY` | reading the boards |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | cache, galleries, leads |
| `CLOUDFLARE_ACCOUNT_ID` / `CLOUDFLARE_API_TOKEN` | photo uploads |
| `CLOUDFLARE_ACCOUNT_HASH` | building delivery URLs (has a fallback) |
| `ADMIN_PASSWORD` | `/admin/photos` and all `/api/admin/*` |
| `CRON_SECRET` | authenticating the scheduled refresh |
| `CACHE_REFRESH_SECRET` | manual cache clear |
| `NEXT_PUBLIC_CARTO_API_KEY` | optional — switches the map to Carto Positron. Absent = keyless Esri Light Gray |

Env vars load at **build** time. After changing one in Vercel you must
redeploy, or the running deployment won't see it.

---

## Photos

1. VA goes to `/admin/photos`, signs in with `ADMIN_PASSWORD`
2. Picks a building (no-photo buildings sort to the top — the list is the queue)
3. Drags in photos, reorders, saves

Files go **browser → Cloudflare directly** via Direct Creator Upload. They do
not pass through Vercel, which caps request bodies at 4.5MB while these photos
run 2–5MB. The API token stays server-side; only a one-time upload URL reaches
the browser.

Known upload failures, both pre-checked with a clear message:
- over Cloudflare's **10MB** per-image limit
- **HEIC/HEIF** (the iPhone default) — passes a `type.startsWith("image/")`
  check but Cloudflare rejects it

Coverage: `/api/photo-status`.

---

## Endpoints

**Operational**

| Route | Purpose |
|---|---|
| `/api/cron-refresh` | scheduled rebuild, every 10 min |
| `/api/cache-refresh` | clear the cache manually |
| `/api/photo-status` | photo coverage per city, and who still needs photos |

**Diagnostics** — these exist because each one was written to chase a real bug.

| Route | Answers |
|---|---|
| `/api/data-health` | **start here.** Everything missing across every board, ranked by cost. `?names=1` lists the buildings, `?city=X` narrows |
| `/api/debug-columns` | which expected columns don't exist on which board |
| `/api/debug-boards` | per-board health; `?heavy=1` uses the production query shape. Also names active listings missing coordinates |
| `/api/debug-beds?city=X` | parsed bedrooms per building, and how many have no unit data |
| `/api/debug-neighbourhoods?city=X` | borough coverage and counts |
| `/api/find-building?name=X&board=ID` | full column + subitem dump for one building |

**Admin** (all require the `x-admin-password` header)

`/api/admin/ping` · `/api/admin/buildings` · `/api/admin/upload-url` ·
`/api/admin/save-gallery` · `/api/admin/leads`

---

## Runbook

**A city disappeared from the site**
Almost certainly a monday query failure. `/api/cron-refresh` returns
`boardFailures`. The site backfills that city from a last-known-good snapshot
rather than dropping it, so this should degrade to slightly stale data rather
than a missing city.

**Data looks stale**
Two caches, and they are independent. Redis (10 min) and the page render.
`/search` is `force-dynamic`; the homepage and listing pages are ISR at 600s.
A page cache once served hour-old HTML while Redis was perfectly current —
check both before concluding anything.

**A listing doesn't appear**
In order: status must be Lease-Up or Stabilization; it needs coordinates
(`/api/debug-boards` names the ones missing them); then check
`/api/debug-columns` for that board.

**Bed filters return nothing for a city**
`/api/debug-beds?city=X`. `noBedroomData` counts buildings with no unit
subitems — those are invisible to every bed filter. That's a monday data gap,
not a code bug.

**Cache keys**
`CACHE_KEY` must be bumped when the building shape changes, in three files:
`lib/monday.js`, `app/api/cron-refresh/route.js`, `app/api/cache-refresh/route.js`.
Currently `rentbolt:buildings:v21`.

`LAST_GOOD_KEY` sits alongside it and must be bumped too — it was missed by
every bump up to v20 because the string doesn't contain `buildings:vNN`.

---

## Hard-won details

Each of these cost real debugging time. Don't undo them.

- **Cloudflare uploads need native `FormData`/`Blob`.** The `form-data` npm
  package produces a malformed multipart body on Vercel's runtime.
- **`mondayQuery` must be `cache: "no-store"`.** It once had
  `next: { revalidate: 3600 }`, creating a hidden Next.js cache *underneath*
  Redis. `/api/cache-refresh` only cleared Redis, so stale monday responses
  were laundered as fresh indefinitely.
- **Per-board failures must not be swallowed.** A `catch { return [] }` is how
  Montreal vanished silently for weeks.
- **Subitem columns are an allowlist.** Fetching every subitem column for every
  item tripped monday's complexity budget on the largest board.
- **Coordinates of `0,0` mean "no location", not Null Island.** Anything that
  transforms coordinates must leave zeros alone, or a pin lands off Africa and
  drags the map viewport across the Atlantic.
- **Neighbourhood lookup runs on TRUE coordinates**, before fuzzing, and
  server-side. Done on the fuzzed pins, a building near a borough line gets
  filed under the wrong one; done client-side, a 446KB polygon file ships to
  every visitor.

---

## Adding a city's neighbourhoods

1. Get a GeoJSON of its neighbourhoods
2. Reduce it to `name` + geometry, round coordinates to 5 decimals, save to
   `data/boroughs-<city>.json`
3. Add one line to `SETS` in `lib/neighbourhoods.js`

No code changes. A city without a file simply doesn't show the filter.

Currently loaded: **Montreal** (38 boroughs) and **Toronto** (140
neighbourhoods). Toronto's file covers the City of Toronto only — buildings on
that board located in Mississauga or elsewhere in the GTA resolve to no
neighbourhood, which is the same behaviour as having no file at all.

Still to source: Ottawa, London, Kitchener-Waterloo.

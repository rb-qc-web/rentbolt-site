import { Suspense } from "react";
import { fetchBuildings } from "@/lib/monday";
import SearchClient from "./SearchClient";

// Rendered per request. The page was previously cached for an hour, so a
// building marked Leased in Monday could keep appearing long after the Redis
// data had updated — the data was fresh, the HTML was not. Monday is never hit
// directly here; fetchBuildings reads the Redis cache, so this stays cheap.
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Find an Apartment — RentBolt",
  description: "Browse all apartments and rental buildings on a live map across Montreal, Toronto, Ottawa, London and Kitchener-Waterloo.",
};

export default async function SearchPage() {
  const buildings = await fetchBuildings();
  // Only buildings with valid coordinates can render on the map
  const mappable = buildings.filter(b => b.lat && b.lng && b.lat !== 0 && b.lng !== 0);
  return (
    <Suspense fallback={null}>
      <SearchClient buildings={mappable} totalCount={buildings.length} />
    </Suspense>
  );
}

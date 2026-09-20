import { fetchBuildings } from "@/lib/monday";
import SavedClient from "./SavedClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Saved homes — RentBolt",
  robots: { index: false, follow: false },
};

export default async function SavedPage() {
  const buildings = await fetchBuildings();
  // Only what the saved list needs to render.
  const slim = buildings.map(b => ({
    id: b.id,
    slug: b.slug,
    publicName: b.publicName || b.name,
    city: b.city,
    neighbourhood: b.neighbourhood || "",
    startingPrice: b.startingPrice || 0,
    bedrooms: b.bedrooms || [],
    photo: b.photoGallery?.[0] || "",
    tag: b.tag || null,
  }));
  return <SavedClient buildings={slim} />;
}

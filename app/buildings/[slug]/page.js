import { fetchBuildings, fetchBuildingBySlug } from "@/lib/monday";
import { notFound } from "next/navigation";
import BuildingDetailClient from "./BuildingDetailClient";

export const revalidate = 900;

// Generate static pages for all buildings at build time
export async function generateStaticParams() {
  const buildings = await fetchBuildings();
  return buildings.map((b) => ({ slug: b.slug }));
}

// Dynamic metadata for SEO
export async function generateMetadata({ params }) {
  const building = await fetchBuildingBySlug(params.slug);
  if (!building) return {};

  const beds = building.bedrooms || [];
  const bedLabel = beds.length === 0 ? "" : beds.map(b => b === 0 ? "Studio" : `${b} Bed`).join(", ");

  return {
    title: `${building.name} — Starting at $${building.startingPrice?.toLocaleString()}/mo`,
    description: `${bedLabel} apartments available at ${building.name}, ${building.address}. Starting at $${building.startingPrice?.toLocaleString()}/mo. Book a visit with RentBolt.`,
    openGraph: {
      title: `${building.name} | RentBolt`,
      description: `Apartments starting at $${building.startingPrice?.toLocaleString()}/mo in ${building.city}.`,
      images: building.photoUrl ? [{ url: building.photoUrl }] : [],
    },
  };
}

export default async function BuildingPage({ params }) {
  const building = await fetchBuildingBySlug(params.slug);
  if (!building) notFound();

  return <BuildingDetailClient building={building} />;
}

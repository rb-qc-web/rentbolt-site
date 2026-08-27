import { fetchBuildingBySlug } from "@/lib/monday";
import { notFound } from "next/navigation";
import BuildingDetailClient from "./BuildingDetailClient";

// Render on-demand instead of pre-building all pages (faster build)
export const revalidate = 900;
export const dynamicParams = true;

// Dynamic metadata for SEO
export async function generateMetadata({ params }) {
  const building = await fetchBuildingBySlug(params.slug);
  if (!building) return {};

  const beds = building.bedrooms || [];
  const bedLabel = beds.length === 0 ? "" : beds.map(b => b === 0 ? "Studio" : `${b} Bed`).join(", ");

  const streetAddr = building.publicName || building.name;
  return {
    title: `${streetAddr}, ${building.city} — Apartments for Rent`,
    description: `${bedLabel} apartments available near ${streetAddr} in ${building.city}. Book a visit with RentBolt.`,
    openGraph: {
      title: `${streetAddr} | RentBolt`,
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

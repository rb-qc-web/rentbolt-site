import { fetchBuildings, fetchCities } from "@/lib/monday";
import HomeClient from "./HomeClient";

// ISR: revalidate building data every 15 minutes
export const revalidate = 900;

export default async function HomePage() {
  const buildings = await fetchBuildings();
  const cities = await fetchCities();

  return <HomeClient buildings={buildings} cities={cities} />;
}

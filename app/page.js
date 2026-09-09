import { fetchBuildings, fetchCities } from "@/lib/monday";
import HomeClient from "./HomeClient";

// ISR: revalidate building data every 15 minutes
// Aligned with the 10-minute data cron.
export const revalidate = 600;

export default async function HomePage() {
  const buildings = await fetchBuildings();
  const cities = await fetchCities();

  return <HomeClient buildings={buildings} cities={cities} />;
}

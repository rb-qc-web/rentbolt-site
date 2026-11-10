import AdminListingsClient from "./AdminListingsClient";

export const metadata = {
  title: "Listings — RentBolt Admin",
  robots: { index: false, follow: false },
};

export default function AdminListingsPage() {
  return <AdminListingsClient />;
}

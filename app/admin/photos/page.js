import AdminPhotosClient from "./AdminPhotosClient";

export const metadata = {
  title: "Photo Upload — RentBolt Admin",
  robots: { index: false, follow: false },
};

export default function AdminPhotosPage() {
  return <AdminPhotosClient />;
}

import AdminHomeClient from "./AdminHomeClient";

export const metadata = {
  title: "Admin — RentBolt",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return <AdminHomeClient />;
}

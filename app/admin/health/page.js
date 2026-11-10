import AdminHealthClient from "./AdminHealthClient";

export const metadata = {
  title: "Diagnostics — RentBolt Admin",
  robots: { index: false, follow: false },
};

export default function AdminHealthPage() {
  return <AdminHealthClient />;
}

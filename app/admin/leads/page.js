import AdminLeadsClient from "./AdminLeadsClient";

export const metadata = {
  title: "Leads — RentBolt Admin",
  robots: { index: false, follow: false },
};

export default function AdminLeadsPage() {
  return <AdminLeadsClient />;
}

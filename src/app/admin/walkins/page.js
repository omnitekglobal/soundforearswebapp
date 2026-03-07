import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Daily Walk-ins – Admin",
};

export default async function AdminWalkinsPage() {
  await requireRole(["admin"]);

  const walkins = await prisma.walkIn.findMany({
    orderBy: { date: "desc" },
    take: 200,
  });

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "purpose", header: "Purpose" },
    { key: "place", header: "Place" },
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Daily Walk-ins">
        <DataTable
          columns={columns}
          data={walkins}
          emptyMessage="No walk-ins recorded yet."
        />
      </Card>
    </div>
  );
}


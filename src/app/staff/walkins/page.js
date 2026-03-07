import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "Walk-ins – Staff",
};

export default async function StaffWalkinsPage() {
  await requireRole(["staff"]);
  const session = await requireSession();

  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });

  if (!staff?.permissions?.canAccessWalkIn) {
    return (
      <div className="space-y-4">
        <Card title="Daily Walk-ins">
          <p className="text-sm text-slate-600">
            You do not have permission to view walk-ins. Please contact an
            admin.
          </p>
        </Card>
      </div>
    );
  }

  const walkins = await prisma.walkIn.findMany({
    orderBy: { date: "desc" },
    take: 100,
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


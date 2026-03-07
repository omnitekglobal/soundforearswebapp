import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "Therapies – Staff",
};

export default async function StaffTherapiesPage() {
  await requireRole(["staff"]);
  const session = await requireSession();

  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
  });

  const assignments = staff
    ? await prisma.therapyAssignment.findMany({
        where: { staffId: staff.id },
        include: { patient: true },
        orderBy: { startTime: "asc" },
        take: 100,
      })
    : [];

  const columns = [
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    { key: "service", header: "Service" },
    {
      key: "startTime",
      header: "Start",
      render: (row) =>
        row.startTime ? new Date(row.startTime).toLocaleTimeString() : "—",
    },
    {
      key: "endTime",
      header: "End",
      render: (row) =>
        row.endTime ? new Date(row.endTime).toLocaleTimeString() : "—",
    },
    { key: "status", header: "Status" },
  ];

  return (
    <div className="space-y-4">
      <Card title="Assigned Therapies">
        <DataTable
          columns={columns}
          data={assignments}
          emptyMessage="No therapy assignments yet."
        />
      </Card>
    </div>
  );
}


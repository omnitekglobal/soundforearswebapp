import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "My Attendance – Staff",
};

export default async function StaffAttendancePage() {
  await requireRole(["staff"]);
  const session = await requireSession();

  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
  });

  const records = staff
    ? await prisma.attendance.findMany({
        where: { staffId: staff.id },
        orderBy: { date: "desc" },
        take: 60,
      })
    : [];

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "checkIn",
      header: "Check-in",
      render: (row) =>
        row.checkIn ? new Date(row.checkIn).toLocaleTimeString() : "—",
    },
    {
      key: "checkOut",
      header: "Check-out",
      render: (row) =>
        row.checkOut ? new Date(row.checkOut).toLocaleTimeString() : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="My Attendance">
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
        />
      </Card>
    </div>
  );
}


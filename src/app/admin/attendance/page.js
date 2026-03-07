import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Attendance – Admin",
};

export default async function AdminAttendancePage() {
  await requireRole(["admin"]);

  const records = await prisma.attendance.findMany({
    include: {
      staff: true,
      patient: true,
    },
    orderBy: { date: "desc" },
    take: 100,
  });

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "staff",
      header: "Staff",
      render: (row) => row.staff?.name || "—",
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
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
    { key: "notes", header: "Notes" },
  ];

  return (
    <div className="space-y-4">
      <Card title="Attendance">
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
        />
      </Card>
    </div>
  );
}


import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "Attendance – Patient",
};

export default async function PatientAttendancePage() {
  await requireRole(["patient"]);
  const session = await requireSession();

  const patient = await prisma.patient.findFirst({
    where: { userId: session.userId },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const records = patient
    ? await prisma.attendance.findMany({
        where: { patientId: patient.id },
        orderBy: { date: "desc" },
        take: 60,
      })
    : [];

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => {
        const d = new Date(row.date);
        const sameDay =
          d.getFullYear() === today.getFullYear() &&
          d.getMonth() === today.getMonth() &&
          d.getDate() === today.getDate();
        return (
          <span>
            {d.toLocaleDateString()}
            {sameDay && (
              <span className="ml-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-100">
                Today – editable
              </span>
            )}
          </span>
        );
      },
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
      <Card title="Attendance">
        <p className="mb-3 text-xs text-slate-500">
          You can only add or edit today&apos;s attendance. Past records are
          read-only.
        </p>
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
        />
      </Card>
    </div>
  );
}


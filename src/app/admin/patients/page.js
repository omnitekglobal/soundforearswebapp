import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Patients – Admin",
};

export default async function AdminPatientsPage() {
  await requireRole(["admin"]);

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });

  const columns = [
    { key: "patientName", header: "Patient Name" },
    { key: "childName", header: "Child Name" },
    { key: "age", header: "Age" },
    { key: "sex", header: "Sex" },
    { key: "services", header: "Services" },
    {
      key: "attendance",
      header: "Attendance",
      render: () => "—",
    },
    {
      key: "amount",
      header: "Amount",
    },
    {
      key: "advance",
      header: "Advance",
    },
    {
      key: "due",
      header: "Due",
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Patients">
        <DataTable
          columns={columns}
          data={patients}
          emptyMessage="No patients added yet."
        />
      </Card>
    </div>
  );
}


import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";

export const metadata = {
  title: "Daily Ledger – Admin",
};

export default async function AdminLedgerPage() {
  await requireRole(["admin"]);

  const entries = await prisma.ledger.findMany({
    include: { patient: true },
    orderBy: { date: "desc" },
    take: 200,
  });

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    { key: "description", header: "Description" },
    { key: "income", header: "Income" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    { key: "expense", header: "Expense" },
  ];

  return (
    <div className="space-y-4">
      <Card title="Daily Ledger">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No ledger entries yet."
        />
      </Card>
    </div>
  );
}


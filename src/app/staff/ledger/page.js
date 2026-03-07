import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "Ledger – Staff",
};

export default async function StaffLedgerPage() {
  await requireRole(["staff"]);
  const session = await requireSession();

  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });

  if (!staff?.permissions?.canAccessLedger) {
    return (
      <div className="space-y-4">
        <Card title="Ledger">
          <p className="text-sm text-slate-600">
            You do not have permission to view the ledger. Please contact an
            admin.
          </p>
        </Card>
      </div>
    );
  }

  const entries = await prisma.ledger.findMany({
    orderBy: { date: "desc" },
    take: 100,
  });

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => new Date(row.date).toLocaleDateString(),
    },
    { key: "description", header: "Description" },
    { key: "income", header: "Income" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    { key: "expense", header: "Expense" },
  ];

  return (
    <div className="space-y-4">
      <Card title="Ledger">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No ledger entries yet."
        />
      </Card>
    </div>
  );
}


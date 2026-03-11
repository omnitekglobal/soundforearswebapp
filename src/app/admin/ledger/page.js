import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { deleteLedgerEntry } from "./actions";

export const metadata = {
  title: "Daily Ledger – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export default async function AdminLedgerPage({ searchParams }) {
  await requireRole(["admin"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, {
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const orderBy = getOrderBy(params, ["date", "description", "cr", "dr"], { date: "desc" });

  const [entries, totalCount] = await Promise.all([
    prisma.ledger.findMany({
      where,
      include: { patient: true },
      orderBy,
      skip,
      take,
    }),
    prisma.ledger.count({ where }),
  ]);

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => formatDateTime(row.date),
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    { key: "description", header: "Description" },
    { key: "cr", header: "CR" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    { key: "dr", header: "DR" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <DeleteButton action={deleteLedgerEntry.bind(null, row.id)}>
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Daily Ledger (read-only)">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No ledger entries yet."
          basePath="/admin/ledger"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "description", header: "Description" },
            { key: "patient", header: "Patient" },
          ]}
          sortableColumns={["date", "description", "cr", "dr"]}
        />
      </Card>
    </div>
  );
}

import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createPayoutEntry, deleteLedgerEntry } from "../actions";

export const metadata = {
  title: "Payouts – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export default async function AdminPayoutsPage({ searchParams }) {
  await requireRole(["admin"]);
  const params =
    searchParams != null && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams ?? {};

  const { skip, take } = getSkipTake(params);
  const whereFilters = getWhere(params, {
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const where =
    whereFilters && Object.keys(whereFilters).length > 0
      ? { AND: [{ dr: { gt: 0 } }, whereFilters] }
      : { dr: { gt: 0 } };

  const orderBy = getOrderBy(params, ["date", "description", "dr"], {
    date: "desc",
  });

  const [entries, totalCount, patientList] = await Promise.all([
    prisma.ledger.findMany({
      where,
      include: { patient: true },
      orderBy,
      skip,
      take,
    }),
    prisma.ledger.count({ where }),
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
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
    { key: "dr", header: "DR" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <button
            formAction={deleteLedgerEntry.bind(null, row.id)}
            className="text-rose-600 hover:underline"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card title="Add payout (DR)">
        <form
          action={createPayoutEntry}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Date
            </label>
            <input
              type="date"
              name="date"
              className={inputClass}
              defaultValue={toInputDate(new Date())}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient
            </label>
            <select name="patientId" className={inputClass} defaultValue="">
              <option value="">—</option>
              {patientList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientName}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Description *
            </label>
            <input name="description" className={inputClass} required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              DR (amount)
            </label>
            <input
              type="number"
              name="dr"
              className={inputClass}
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Add payout
            </button>
            <p className="text-xs text-slate-500">
              Only DR is recorded here. Use Sales for CR entries.
            </p>
          </div>
        </form>
      </Card>

      <Card title="Payouts (DR entries)">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No payouts recorded yet."
          basePath="/admin/ledger/payouts"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "description", header: "Description" },
            { key: "patient", header: "Patient" },
          ]}
          sortableColumns={["date", "description", "dr"]}
        />
      </Card>

      <div className="text-xs text-slate-500">
        Need to see everything together?{" "}
        <Link href="/admin/ledger" className="text-sky-600 hover:underline">
          Open full ledger
        </Link>
        .
      </div>
    </div>
  );
}


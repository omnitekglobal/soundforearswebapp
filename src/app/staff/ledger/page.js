import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import {
  createLedgerEntry,
  updateLedgerEntry,
  deleteLedgerEntry,
} from "./actions";

export const metadata = {
  title: "Ledger – Staff",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export default async function StaffLedgerPage({ searchParams }) {
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

  const editId = typeof searchParams?.edit === "string" ? searchParams.edit : null;
  const entryToEdit = editId
    ? await prisma.ledger.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(searchParams);
  const where = getWhere(searchParams, {
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const orderBy = getOrderBy(searchParams, ["date", "description", "income", "expense"], { date: "desc" });

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
    { key: "income", header: "Income" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    { key: "expense", header: "Expense" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/staff/ledger?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </Link>
          <form action={deleteLedgerEntry.bind(null, row.id)} className="inline">
            <button type="submit" className="text-red-600 hover:underline">
              Delete
            </button>
          </form>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title={entryToEdit ? "Edit ledger entry" : "Add ledger entry"}
        actions={
          entryToEdit ? (
            <Link
              href="/staff/ledger"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
          ) : null
        }
      >
        <form
          action={
            entryToEdit
              ? updateLedgerEntry.bind(null, entryToEdit.id)
              : createLedgerEntry
          }
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
              defaultValue={
                entryToEdit ? toInputDate(entryToEdit.date) : toInputDate(new Date())
              }
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient
            </label>
            <select
              name="patientId"
              className={inputClass}
              defaultValue={entryToEdit?.patientId ?? ""}
            >
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
            <input
              name="description"
              className={inputClass}
              defaultValue={entryToEdit?.description ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Income
            </label>
            <input
              type="number"
              name="income"
              className={inputClass}
              defaultValue={entryToEdit?.income ?? 0}
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Advance
            </label>
            <input
              type="number"
              name="advance"
              className={inputClass}
              defaultValue={entryToEdit?.advance ?? 0}
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Due
            </label>
            <input
              type="number"
              name="due"
              className={inputClass}
              defaultValue={entryToEdit?.due ?? 0}
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Expense
            </label>
            <input
              type="number"
              name="expense"
              className={inputClass}
              defaultValue={entryToEdit?.expense ?? 0}
              min={0}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {entryToEdit ? "Update" : "Add"} entry
            </button>
          </div>
        </form>
      </Card>

      <Card title="Ledger">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No ledger entries yet."
          basePath="/staff/ledger"
          searchParams={searchParams}
          totalCount={totalCount}
          filterableColumns={[
            { key: "description", header: "Description" },
            { key: "patient", header: "Patient" },
          ]}
          sortableColumns={["date", "description", "income", "expense"]}
        />
      </Card>
    </div>
  );
}

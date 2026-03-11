import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { toDateTimeLocalValue } from "@/lib/datetime";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createAttendance, updateAttendance, deleteAttendance } from "./actions";

export const metadata = {
  title: "Attendance – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";


export default async function AdminAttendancePage({ searchParams }) {
  await requireRole(["admin"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const editId = typeof params.edit === "string" ? params.edit : null;
  const recordToEdit = editId
    ? await prisma.attendance.findUnique({
        where: { id: editId },
        include: { staff: true, patient: true },
      })
    : null;

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, {
    staff: { type: "relation", relationKey: "staff", field: "name" },
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const orderBy = getOrderBy(params, ["date", "notes"], { date: "desc" });

  const [records, totalCount, staffList, patientList] = await Promise.all([
    prisma.attendance.findMany({
      where,
      include: { staff: true, patient: true },
      orderBy,
      skip,
      take,
    }),
    prisma.attendance.count({ where }),
    prisma.staff.findMany({ orderBy: { name: "asc" } }),
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
  ]);

  const columns = [
    {
      key: "date",
      header: "Date & time",
      render: (row) => formatDateTime(row.date),
    },
    { key: "staff", header: "Staff", render: (row) => row.staff?.name || "—" },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    {
      key: "debited",
      header: "Debited",
      render: (row) => {
        const p = row.patient;
        if (!p || !p.noOfSessions || p.noOfSessions <= 0) {
          return "—";
        }
        const perSession =
          p.perSessionCharge && p.perSessionCharge > 0
            ? p.perSessionCharge
            : p.amount && p.amount > 0
              ? Math.round(p.amount / p.noOfSessions)
              : null;
        if (!perSession) return "—";
        return `₹${perSession}`;
      },
    },
    { key: "notes", header: "Notes" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/attendance?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </a>
          <DeleteButton action={deleteAttendance.bind(null, row.id)}>
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title={recordToEdit ? "Edit attendance" : "Add attendance"}
        actions={
          recordToEdit ? (
            <a
              href="/admin/attendance"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={
            recordToEdit
              ? updateAttendance.bind(null, recordToEdit.id)
              : createAttendance
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Date & time *
            </label>
            <input
              type="datetime-local"
              name="date"
              className={inputClass}
              defaultValue={recordToEdit ? toDateTimeLocalValue(recordToEdit.date) : toDateTimeLocalValue(new Date())}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Staff
            </label>
            <select
              name="staffId"
              className={inputClass}
              defaultValue={
                recordToEdit?.staff?.id ?? recordToEdit?.staffId ?? ""
              }
            >
              <option value="">—</option>
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient
            </label>
            <select
              name="patientId"
              className={inputClass}
              defaultValue={
                recordToEdit?.patient?.id ?? recordToEdit?.patientId ?? ""
              }
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
              Notes
            </label>
            <input
              name="notes"
              className={inputClass}
              defaultValue={recordToEdit?.notes ?? ""}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {recordToEdit ? "Update" : "Add"} record
            </button>
          </div>
        </form>
      </Card>

      <Card title="Attendance">
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
          basePath="/admin/attendance"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "staff", header: "Staff" },
            { key: "patient", header: "Patient" },
            { key: "notes", header: "Notes" },
          ]}
          sortableColumns={["date", "notes"]}
        />
      </Card>
    </div>
  );
}

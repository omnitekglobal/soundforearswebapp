import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import {
  createMyAttendance,
  updateMyAttendance,
  deleteMyAttendance,
} from "./actions";

export const metadata = {
  title: "My Attendance – Staff",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";


export default async function StaffAttendancePage({ searchParams }) {
  await requireRole(["staff"]);
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
  });

  const editId = typeof searchParams?.edit === "string" ? searchParams.edit : null;
  const recordToEdit = editId
    ? await prisma.attendance.findFirst({
        where: { id: editId, staffId: staff?.id },
      })
    : null;

  const filterWhere = getWhere(searchParams, {
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const where = !staff
    ? undefined
    : filterWhere
      ? { AND: [{ staffId: staff.id }, filterWhere] }
      : { staffId: staff.id };
  const { skip, take } = getSkipTake(searchParams);
  const orderBy = getOrderBy(searchParams, ["date", "notes"], { date: "desc" });

  const [records, totalCount, patientList] = await Promise.all([
    staff
      ? prisma.attendance.findMany({
          where,
          include: { patient: true },
          orderBy,
          skip,
          take,
        })
      : [],
    staff ? prisma.attendance.count({ where }) : 0,
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
  ]);

  const columns = [
    {
      key: "date",
      header: "Date & time",
      render: (row) => formatDateTime(row.date),
    },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    { key: "notes", header: "Notes" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/staff/attendance?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </Link>
          <form action={deleteMyAttendance.bind(null, row.id)} className="inline">
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
        title={recordToEdit ? "Edit attendance" : "Add attendance"}
        actions={
          recordToEdit ? (
            <Link
              href="/staff/attendance"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
          ) : null
        }
      >
        <form
          action={
            recordToEdit
              ? updateMyAttendance.bind(null, recordToEdit.id)
              : createMyAttendance
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {recordToEdit && (
            <div className="sm:col-span-2">
              <span className="text-xs font-medium text-slate-500">Date & time </span>
              <p className="text-sm text-slate-700">{formatDateTime(recordToEdit.date)}</p>
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient
            </label>
            <select
              name="patientId"
              className={inputClass}
              defaultValue={recordToEdit?.patientId ?? ""}
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

      <Card title="My Attendance">
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
          basePath="/staff/attendance"
          searchParams={searchParams}
          totalCount={totalCount}
          filterableColumns={[{ key: "patient", header: "Patient" }, { key: "notes", header: "Notes" }]}
          sortableColumns={["date", "notes"]}
        />
      </Card>
    </div>
  );
}

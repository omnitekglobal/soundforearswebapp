import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Alert from "@/components/ui/Alert";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createMyAttendance, updateMyAttendance } from "./actions";

export const metadata = {
  title: "My Attendance – Staff",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";


export default async function StaffAttendancePage({ searchParams }) {
  await requireRole(["staff"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
  });

  const editId = typeof params.edit === "string" ? params.edit : null;
  const recordToEdit = editId
    ? await prisma.attendance.findFirst({
        where: { id: editId, staffId: staff?.id },
      })
    : null;

  const filterWhere = getWhere(params, {
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const where = !staff
    ? undefined
    : filterWhere
      ? { AND: [{ staffId: staff.id }, filterWhere] }
      : { staffId: staff.id };
  const { skip, take } = getSkipTake(params);
  const orderBy = getOrderBy(params, ["date", "notes"], { date: "desc" });

  const [records, totalCount] = await Promise.all([
    staff
      ? prisma.attendance.findMany({
          where,
          orderBy,
          skip,
          take,
        })
      : [],
    staff ? prisma.attendance.count({ where }) : 0,
  ]);

  const columns = [
    {
      key: "date",
      header: "Date & time",
      render: (row) => formatDateTime(row.date),
    },
    { key: "notes", header: "Notes" },
    // No delete option here; only admins can delete attendance from admin panel
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <Link
          href={`/staff/attendance?edit=${row.id}`}
          className="text-sky-600 hover:underline"
        >
          Edit
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="warning" title="Attendance already recorded">
          {error}
        </Alert>
      )}
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
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[{ key: "notes", header: "Notes" }]}
          sortableColumns={["date", "notes"]}
        />
      </Card>
    </div>
  );
}

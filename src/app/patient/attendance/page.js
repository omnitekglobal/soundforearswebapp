import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Alert from "@/components/ui/Alert";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createMyAttendance } from "./actions";

export const metadata = {
  title: "Attendance – Patient",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function isToday(d) {
  const t = new Date();
  const x = new Date(d);
  return (
    x.getFullYear() === t.getFullYear() &&
    x.getMonth() === t.getMonth() &&
    x.getDate() === t.getDate()
  );
}

export default async function PatientAttendancePage({ searchParams }) {
  await requireRole(["patient"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const session = await requireSession();
  const patient = await prisma.patient.findFirst({
    where: { userId: session.userId },
  });

  const filterWhere = getWhere(params, {});
  const where = !patient
    ? undefined
    : filterWhere
      ? { AND: [{ patientId: patient.id }, filterWhere] }
      : { patientId: patient.id };
  const { skip, take } = getSkipTake(params);
  const orderBy = getOrderBy(params, ["date", "notes"], { date: "desc" });

  const [records, totalCount] = await Promise.all([
    patient
      ? prisma.attendance.findMany({
          where,
          orderBy,
          skip,
          take,
        })
      : [],
    patient ? prisma.attendance.count({ where }) : 0,
  ]);

  const totalSessions = patient?.noOfSessions ?? null;
  const perSession =
    totalSessions && totalSessions > 0 && patient.amount > 0
      ? Math.round(patient.amount / totalSessions)
      : null;

  const columns = [
    {
      key: "date",
      header: "Date & time",
      render: (row) => {
        const sameDay = isToday(row.date);
        return (
          <span>
            {formatDateTime(row.date)}
            {sameDay && (
              <span className="ml-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700 ring-1 ring-emerald-100">
                Today
              </span>
            )}
          </span>
        );
      },
    },
    { key: "notes", header: "Notes" },
    {
      key: "debited",
      header: "Debited",
      render: () => (perSession != null ? `₹${perSession}` : "—"),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="warning" title="Attendance already recorded">
          {error}
        </Alert>
      )}
      <Card title="Add today's attendance">
        <p className="mb-3 text-xs text-slate-500">
          You can add today&apos;s attendance only. Records are view-only and
          cannot be edited or deleted.
        </p>
        <form action={createMyAttendance} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Notes
            </label>
            <input name="notes" className={inputClass} />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              Add attendance
            </button>
          </div>
        </form>
      </Card>

      <Card title="Attendance">
        <DataTable
          columns={columns}
          data={records}
          emptyMessage="No attendance records yet."
          basePath="/patient/attendance"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[{ key: "notes", header: "Notes" }]}
          sortableColumns={["date", "notes"]}
        />
      </Card>
    </div>
  );
}

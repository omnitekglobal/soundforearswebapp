import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import {
  createTherapyAssignment,
  updateTherapyAssignment,
  deleteTherapyAssignment,
} from "./actions";

export const metadata = {
  title: "Therapies – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDateTime(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 16);
}

export default async function AdminTherapiesPage({ searchParams }) {
  await requireRole(["admin"]);
  const editId = typeof searchParams?.edit === "string" ? searchParams.edit : null;
  const assignmentToEdit = editId
    ? await prisma.therapyAssignment.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(searchParams);
  const where = getWhere(searchParams, {
    staff: { type: "relation", relationKey: "staff", field: "name" },
    patient: { type: "relation", relationKey: "patient", field: "patientName" },
  });
  const orderBy = getOrderBy(searchParams, ["startTime", "service", "status"], { startTime: "desc" });

  const [assignments, totalCount, staffList, patientList] = await Promise.all([
    prisma.therapyAssignment.findMany({
      where,
      include: { staff: true, patient: true },
      orderBy,
      skip,
      take,
    }),
    prisma.therapyAssignment.count({ where }),
    prisma.staff.findMany({ orderBy: { name: "asc" } }),
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
  ]);

  const columns = [
    { key: "staff", header: "Staff", render: (row) => row.staff?.name || "—" },
    {
      key: "patient",
      header: "Patient",
      render: (row) => row.patient?.patientName || "—",
    },
    { key: "service", header: "Service" },
    {
      key: "startTime",
      header: "Start",
      render: (row) => formatDateTime(row.startTime),
    },
    {
      key: "endTime",
      header: "End",
      render: (row) => formatDateTime(row.endTime),
    },
    { key: "status", header: "Status" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/therapies?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </Link>
          <form action={deleteTherapyAssignment.bind(null, row.id)} className="inline">
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
        title={assignmentToEdit ? "Edit therapy assignment" : "Add therapy assignment"}
        actions={
          assignmentToEdit ? (
            <Link
              href="/admin/therapies"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
          ) : null
        }
      >
        <form
          action={
            assignmentToEdit
              ? updateTherapyAssignment.bind(null, assignmentToEdit.id)
              : createTherapyAssignment
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Staff *
            </label>
            <select
              name="staffId"
              className={inputClass}
              defaultValue={assignmentToEdit?.staffId ?? ""}
              required
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
              Patient *
            </label>
            <select
              name="patientId"
              className={inputClass}
              defaultValue={assignmentToEdit?.patientId ?? ""}
              required
            >
              <option value="">—</option>
              {patientList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.patientName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Service *
            </label>
            <input
              name="service"
              className={inputClass}
              defaultValue={assignmentToEdit?.service ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Status
            </label>
            <select
              name="status"
              className={inputClass}
              defaultValue={assignmentToEdit?.status ?? "SCHEDULED"}
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Start time *
            </label>
            <input
              type="datetime-local"
              name="startTime"
              className={inputClass}
              defaultValue={
                assignmentToEdit ? toInputDateTime(assignmentToEdit.startTime) : ""
              }
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              End time *
            </label>
            <input
              type="datetime-local"
              name="endTime"
              className={inputClass}
              defaultValue={
                assignmentToEdit ? toInputDateTime(assignmentToEdit.endTime) : ""
              }
              required
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {assignmentToEdit ? "Update" : "Add"} assignment
            </button>
          </div>
        </form>
      </Card>

      <Card title="Therapy assignments">
        <DataTable
          columns={columns}
          data={assignments}
          emptyMessage="No therapy assignments yet."
          basePath="/admin/therapies"
          searchParams={searchParams}
          totalCount={totalCount}
          filterableColumns={[
            { key: "staff", header: "Staff" },
            { key: "patient", header: "Patient" },
            { key: "service", header: "Service" },
            { key: "status", header: "Status" },
          ]}
          sortableColumns={["startTime", "service", "status"]}
        />
      </Card>
    </div>
  );
}

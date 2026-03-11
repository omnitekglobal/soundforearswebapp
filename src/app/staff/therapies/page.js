import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import {
  createMyTherapyAssignment,
  updateMyTherapyAssignment,
  deleteMyTherapyAssignment,
} from "./actions";

export const metadata = {
  title: "Therapies – Staff",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDateTime(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 16);
}

export default async function StaffTherapiesPage({ searchParams }) {
  await requireRole(["staff"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
  });

  const editId = typeof params.edit === "string" ? params.edit : null;
  const assignmentToEdit = editId
    ? await prisma.therapyAssignment.findFirst({
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
  const orderBy = getOrderBy(params, ["startTime", "service", "status"], { startTime: "desc" });

  const [assignments, totalCount, patientList] = await Promise.all([
    staff
      ? prisma.therapyAssignment.findMany({
          where,
          include: { patient: true },
          orderBy,
          skip,
          take,
        })
      : [],
    staff ? prisma.therapyAssignment.count({ where }) : 0,
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
  ]);

  const columns = [
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
          <a
            href={`/staff/therapies?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </a>
          <DeleteButton action={deleteMyTherapyAssignment.bind(null, row.id)}>
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title={assignmentToEdit ? "Edit assignment" : "Add therapy assignment"}
        actions={
          assignmentToEdit ? (
            <a
              href="/staff/therapies"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={
            assignmentToEdit
              ? updateMyTherapyAssignment.bind(null, assignmentToEdit.id)
              : createMyTherapyAssignment
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
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

      <Card title="Assigned Therapies">
        <DataTable
          columns={columns}
          data={assignments}
          emptyMessage="No therapy assignments yet."
          basePath="/staff/therapies"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
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

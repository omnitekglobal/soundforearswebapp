import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createWalkIn, updateWalkIn, deleteWalkIn } from "./actions";

export const metadata = {
  title: "Walk-ins – Staff",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export default async function StaffWalkinsPage({ searchParams }) {
  await requireRole(["staff"]);
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });

  if (!staff?.permissions?.canAccessWalkIn) {
    return (
      <div className="space-y-4">
        <Card title="Daily Walk-ins">
          <p className="text-sm text-slate-600">
            You do not have permission to view walk-ins. Please contact an admin.
          </p>
        </Card>
      </div>
    );
  }

  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const editId = typeof params.edit === "string" ? params.edit : null;
  const walkInToEdit = editId
    ? await prisma.walkIn.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, {});
  const orderBy = getOrderBy(params, ["date", "name", "purpose"], { date: "desc" });

  const [walkins, totalCount] = await Promise.all([
    prisma.walkIn.findMany({ where, orderBy, skip, take }),
    prisma.walkIn.count({ where }),
  ]);

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "purpose", header: "Purpose" },
    { key: "place", header: "Place" },
    {
      key: "date",
      header: "Date",
      render: (row) => formatDateTime(row.date),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/staff/walkins?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </Link>
          <DeleteButton action={deleteWalkIn.bind(null, row.id)}>
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Card
        title={walkInToEdit ? "Edit walk-in" : "Add walk-in"}
        actions={
          walkInToEdit ? (
            <Link
              href="/staff/walkins"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
          ) : null
        }
      >
        <form
          action={
            walkInToEdit ? updateWalkIn.bind(null, walkInToEdit.id) : createWalkIn
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Name *
            </label>
            <input
              name="name"
              className={inputClass}
              defaultValue={walkInToEdit?.name ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Phone
            </label>
            <input
              name="phone"
              className={inputClass}
              defaultValue={walkInToEdit?.phone ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Purpose *
            </label>
            <input
              name="purpose"
              className={inputClass}
              defaultValue={walkInToEdit?.purpose ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Place
            </label>
            <input
              name="place"
              className={inputClass}
              defaultValue={walkInToEdit?.place ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Date
            </label>
            <input
              type="date"
              name="date"
              className={inputClass}
              defaultValue={
                walkInToEdit ? toInputDate(walkInToEdit.date) : toInputDate(new Date())
              }
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {walkInToEdit ? "Update" : "Add"} walk-in
            </button>
          </div>
        </form>
      </Card>

      <Card title="Daily Walk-ins">
        <DataTable
          columns={columns}
          data={walkins}
          emptyMessage="No walk-ins recorded yet."
          basePath="/staff/walkins"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "name", header: "Name" },
            { key: "purpose", header: "Purpose" },
          ]}
          sortableColumns={["date", "name", "purpose"]}
        />
      </Card>
    </div>
  );
}

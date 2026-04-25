import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createWalkIn, updateWalkIn, deleteWalkIn } from "./actions";
import WalkInPatientFields from "./WalkInPatientFields";
import { CLINIC_TIMEZONE } from "@/lib/datetime";

export const metadata = {
  title: "Daily Walk-ins – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

// Returns YYYY-MM-DD in IST — correct value for <input type="date">
function toInputDate(d) {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-CA", { timeZone: CLINIC_TIMEZONE });
}

// Human-readable IST date for table display
function formatDateIST(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function AdminWalkinsPage({ searchParams }) {
  await requireAdminOrStaffForModule("walkins");
  const params =
    searchParams != null && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams ?? {};

  const editId = typeof params.edit === "string" ? params.edit : null;
  const walkInToEdit = editId
    ? await prisma.walkIn.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, { name: {}, purpose: {} });
  const orderBy = getOrderBy(params, ["date", "name", "purpose"], { date: "desc" });

  const [walkins, totalCount, patients] = await Promise.all([
    prisma.walkIn.findMany({ where, orderBy, skip, take }),
    prisma.walkIn.count({ where }),
    prisma.patient.findMany({ orderBy: { patientName: "asc" } }),
  ]);

  const columns = [
    { key: "name", header: "Name" },
    { key: "phone", header: "Phone" },
    { key: "purpose", header: "Purpose" },
    { key: "place", header: "Place" },
    {
      key: "date",
      header: "Date",
      render: (row) => row.date.toDateString(),
    },
    {
      key: "date",
      header: "Created Date",
      render: (row) => formatDateIST(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <a href={`/admin/walkins?edit=${row.id}`} className="text-sky-600 hover:underline">
            Edit
          </a>
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
            <a href="/admin/walkins" className="text-sm text-slate-500 hover:text-slate-700">
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={walkInToEdit ? updateWalkIn.bind(null, walkInToEdit.id) : createWalkIn}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <WalkInPatientFields
            patients={patients}
            walkInToEdit={walkInToEdit}
            inputClass={inputClass}
          />
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Purpose *</label>
            <input
              name="purpose"
              className={inputClass}
              defaultValue={walkInToEdit?.purpose ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Place</label>
            <input
              name="place"
              className={inputClass}
              defaultValue={walkInToEdit?.place ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
            <input
              type="date"
              name="date"
              className={inputClass}
              defaultValue={toInputDate(walkInToEdit?.date ?? new Date())}
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
          basePath="/admin/walkins"
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
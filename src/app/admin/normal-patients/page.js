import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Alert from "@/components/ui/Alert";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { formatDate } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createPatient, updatePatient, deletePatient } from "../patients/actions";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export const metadata = {
  title: "Normal patients – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const PATIENT_SORT_KEYS = ["patientName", "age", "sex", "services", "address", "date", "createdAt"];
const PATIENT_FILTER_CONFIG = {};
const DEFAULT_ORDER = { createdAt: "desc" };

export default async function AdminNormalPatientsPage({ searchParams }) {
  await requireAdminOrStaffForModule("normalPatients");
  const params =
    searchParams != null && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams ?? {};
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const editId = typeof params.edit === "string" ? params.edit : null;
  const patientToEdit = editId
    ? await prisma.patient.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(params);
  const baseWhere = getWhere(params, PATIENT_FILTER_CONFIG);
  const where =
    baseWhere && Object.keys(baseWhere).length > 0
      ? { AND: [{ patientType: "normal" }, baseWhere] }
      : { patientType: "normal" };
  const orderBy = getOrderBy(params, PATIENT_SORT_KEYS, DEFAULT_ORDER);

  const [patients, totalCount] = await Promise.all([
    prisma.patient.findMany({ where, orderBy, skip, take }),
    prisma.patient.count({ where }),
  ]);

  const columns = [
    { key: "patientName", header: "Patient Name" },
    { key: "age", header: "Age" },
    { key: "sex", header: "Sex" },
    { key: "address", header: "Address", render: (row) => row.address || "—" },
    { key: "services", header: "Services" },
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    { key: "email", header: "Email", render: (row) => row.email || "—" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/normal-patients?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </a>
          <DeleteButton
            action={deletePatient.bind(null, row.id)}
            confirmMessage="Are you sure you want to delete this patient? This cannot be undone."
          >
            Delete
          </DeleteButton>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {error && (
        <Alert type="error" title="Patient error">
          {error}
        </Alert>
      )}
      <Card
        title={patientToEdit ? "Edit normal patient" : "Add normal patient"}
        actions={
          patientToEdit ? (
            <a
              href="/admin/normal-patients"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={
            patientToEdit
              ? updatePatient.bind(null, patientToEdit.id)
              : createPatient
          }
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient name *
            </label>
            <input
              name="patientName"
              className={inputClass}
              defaultValue={patientToEdit?.patientName ?? ""}
              required
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
              defaultValue={toInputDate(patientToEdit?.date)}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              className={inputClass}
              defaultValue={patientToEdit?.phone ?? ""}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Email
            </label>
            <input
              type="email"
              name="email"
              className={inputClass}
              defaultValue={patientToEdit?.email ?? ""}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Age
            </label>
            <input
              type="number"
              name="age"
              className={inputClass}
              defaultValue={patientToEdit?.age ?? ""}
              min={0}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Sex
            </label>
            <select
              name="sex"
              className={inputClass}
              defaultValue={patientToEdit?.sex ?? "OTHER"}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Address
            </label>
            <input
              name="address"
              className={inputClass}
              defaultValue={patientToEdit?.address ?? ""}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Notes / Services
            </label>
            <input
              name="services"
              className={inputClass}
              defaultValue={patientToEdit?.services ?? ""}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <input type="hidden" name="patientType" value="normal" />
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {patientToEdit ? "Update" : "Add"} normal patient
            </button>
          </div>
        </form>
      </Card>

      <Card title="Normal patients">
        <DataTable
          columns={columns}
          data={patients}
          emptyMessage="No normal patients added yet."
          basePath="/admin/normal-patients"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "patientName", header: "Patient Name" },
            { key: "address", header: "Address" },
            { key: "services", header: "Services / Notes" },
            { key: "phone", header: "Phone" },
            { key: "email", header: "Email" },
          ]}
          sortableColumns={PATIENT_SORT_KEYS}
          defaultSort="createdAt"
          defaultDir="desc"
        />
      </Card>
    </div>
  );
}


import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole } from "@/lib/auth";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createPatient, updatePatient, deletePatient } from "./actions";

export const metadata = {
  title: "Patients – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const PATIENT_SORT_KEYS = ["patientName", "childName", "age", "sex", "services", "amount", "advance", "due", "createdAt"];
const PATIENT_FILTER_CONFIG = {};
const DEFAULT_ORDER = { createdAt: "desc" };

export default async function AdminPatientsPage({ searchParams }) {
  await requireRole(["admin"]);
  const editId = typeof searchParams?.edit === "string" ? searchParams.edit : null;
  const patientToEdit = editId
    ? await prisma.patient.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(searchParams);
  const where = getWhere(searchParams, PATIENT_FILTER_CONFIG);
  const orderBy = getOrderBy(searchParams, PATIENT_SORT_KEYS, DEFAULT_ORDER);

  const [patients, totalCount] = await Promise.all([
    prisma.patient.findMany({ where, orderBy, skip, take }),
    prisma.patient.count({ where }),
  ]);

  const columns = [
    { key: "patientName", header: "Patient Name" },
    { key: "childName", header: "Child Name" },
    { key: "age", header: "Age" },
    { key: "sex", header: "Sex" },
    { key: "services", header: "Services" },
    { key: "amount", header: "Amount" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/patients?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </Link>
          <form action={deletePatient.bind(null, row.id)} className="inline">
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
        title={patientToEdit ? "Edit patient" : "Add patient"}
        actions={
          patientToEdit ? (
            <Link
              href="/admin/patients"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </Link>
          ) : null
        }
      >
        <form
          action={patientToEdit ? updatePatient.bind(null, patientToEdit.id) : createPatient}
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
              Child name
            </label>
            <input
              name="childName"
              className={inputClass}
              defaultValue={patientToEdit?.childName ?? ""}
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
              Services
            </label>
            <input
              name="services"
              className={inputClass}
              defaultValue={patientToEdit?.services ?? ""}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Amount
            </label>
            <input
              type="number"
              name="amount"
              className={inputClass}
              defaultValue={patientToEdit?.amount ?? 0}
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
              defaultValue={patientToEdit?.advance ?? 0}
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
              defaultValue={patientToEdit?.due ?? 0}
              min={0}
            />
          </div>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button
              type="submit"
              className="inline-flex h-8 shrink-0 items-center rounded-md bg-sky-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
            >
              {patientToEdit ? "Update" : "Add"} patient
            </button>
          </div>
        </form>
      </Card>

      <Card title="Patients">
        <DataTable
          columns={columns}
          data={patients}
          emptyMessage="No patients added yet."
          basePath="/admin/patients"
          searchParams={searchParams}
          totalCount={totalCount}
          filterableColumns={[
            { key: "patientName", header: "Patient Name" },
            { key: "childName", header: "Child Name" },
            { key: "services", header: "Services" },
          ]}
          sortableColumns={PATIENT_SORT_KEYS}
          defaultSort="createdAt"
          defaultDir="desc"
        />
      </Card>
    </div>
  );
}

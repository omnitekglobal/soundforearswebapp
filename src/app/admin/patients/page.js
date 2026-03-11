import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Alert from "@/components/ui/Alert";
import DeleteButton from "@/components/ui/DeleteButton";
import { requireRole } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { getSkipTake, getOrderBy, getWhere } from "@/lib/tableQuery";
import { createPatient, updatePatient, deletePatient } from "./actions";

function toInputDate(d) {
  if (!d) return "";
  const x = new Date(d);
  return x.toISOString().slice(0, 10);
}

export const metadata = {
  title: "Patients – Admin",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500";

const PATIENT_SORT_KEYS = ["patientName", "childName", "age", "sex", "services", "amount", "advance", "due", "noOfSessions", "date", "createdAt"];
const PATIENT_FILTER_CONFIG = {};
const DEFAULT_ORDER = { createdAt: "desc" };

export default async function AdminPatientsPage({ searchParams }) {
  await requireRole(["admin"]);
  const params = searchParams != null && typeof searchParams.then === "function" ? await searchParams : (searchParams ?? {});
  const error =
    typeof params.error === "string" ? decodeURIComponent(params.error) : null;
  const editId = typeof params.edit === "string" ? params.edit : null;
  const patientToEdit = editId
    ? await prisma.patient.findUnique({ where: { id: editId } })
    : null;

  const { skip, take } = getSkipTake(params);
  const where = getWhere(params, PATIENT_FILTER_CONFIG);
  const orderBy = getOrderBy(params, PATIENT_SORT_KEYS, DEFAULT_ORDER);

  const [patients, totalCount, attendanceByPatient] = await Promise.all([
    prisma.patient.findMany({ where, orderBy, skip, take }),
    prisma.patient.count({ where }),
    prisma.attendance.groupBy({
      by: ["patientId"],
      where: { patientId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const attendanceCountMap = new Map();
  for (const group of attendanceByPatient) {
    if (!group.patientId) continue;
    attendanceCountMap.set(group.patientId, group._count._all);
  }

  const patientsWithBilling = patients.map((p) => {
    const totalSessions = p.noOfSessions ?? null;
    const perSession =
      p.perSessionCharge && p.perSessionCharge > 0
        ? p.perSessionCharge
        : totalSessions && totalSessions > 0 && p.amount > 0
          ? Math.round(p.amount / totalSessions)
          : null;
    const usedSessions = attendanceCountMap.get(p.id) ?? 0;
    // Allow negative when sessions used exceed package (negative balance)
    const remainingSessions =
      totalSessions != null ? totalSessions - usedSessions : null;
    const remainingAmount =
      perSession != null
        ? p.amount && p.amount > 0
          ? p.amount - perSession * usedSessions
          : remainingSessions != null
            ? perSession * remainingSessions
            : null
        : null;

    return {
      ...p,
      _billing: {
        perSession,
        usedSessions,
        remainingSessions,
        remainingAmount,
      },
    };
  });

  const columns = [
    { key: "patientName", header: "Patient Name" },
    { key: "childName", header: "Child Name" },
    { key: "age", header: "Age" },
    { key: "sex", header: "Sex" },
    { key: "services", header: "Services" },
    { key: "noOfSessions", header: "Sessions", render: (row) => row.noOfSessions ?? "—" },
    {
      key: "usedSessions",
      header: "Used",
      render: (row) => row._billing?.usedSessions ?? "—",
    },
    {
      key: "remainingSessions",
      header: "Remaining",
      render: (row) => row._billing?.remainingSessions ?? "—",
    },
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
    { key: "phone", header: "Phone", render: (row) => row.phone || "—" },
    { key: "email", header: "Email", render: (row) => row.email || "—" },
    { key: "amount", header: "Amount" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
    {
      key: "remainingAmount",
      header: "Remaining Amt",
      render: (row) =>
        row._billing?.remainingAmount != null ? `₹${row._billing.remainingAmount}` : "—",
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => (
        <div className="flex flex-wrap gap-2">
          <a
            href={`/admin/patients?edit=${row.id}`}
            className="text-sky-600 hover:underline"
          >
            Edit
          </a>
          <Link
            href={`/admin/patients/${row.id}/wallet`}
            className="text-sky-600 hover:underline"
          >
            Wallet
          </Link>
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
        title={patientToEdit ? "Edit patient" : "Add patient"}
        actions={
          patientToEdit ? (
            <a
              href="/admin/patients"
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Cancel
            </a>
          ) : null
        }
      >
        <form
          action={patientToEdit ? updatePatient.bind(null, patientToEdit.id) : createPatient}
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              Patient name / Child name *
            </label>
            <input
              name="patientName"
              className={inputClass}
              defaultValue={patientToEdit?.patientName ?? patientToEdit?.childName ?? ""}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">
              No. of sessions
            </label>
            <input
              type="number"
              name="noOfSessions"
              className={inputClass}
              defaultValue={patientToEdit?.noOfSessions ?? ""}
              min={0}
              placeholder="Optional"
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
          {!patientToEdit && (
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">
                Portal password
              </label>
              <input
                type="password"
                name="password"
                className={inputClass}
                placeholder="Set patient login password (optional)"
              />
            </div>
          )}
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
              Per session charge (optional)
            </label>
            <input
              type="number"
              name="perSessionCharge"
              className={inputClass}
              defaultValue={patientToEdit?.perSessionCharge ?? ""}
              min={0}
              placeholder="If set, used instead of Amount / Sessions"
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
          data={patientsWithBilling}
          emptyMessage="No patients added yet."
          basePath="/admin/patients"
          searchParams={params}
          totalCount={totalCount}
          filterableColumns={[
            { key: "patientName", header: "Patient Name" },
            { key: "childName", header: "Child Name" },
            { key: "services", header: "Services" },
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

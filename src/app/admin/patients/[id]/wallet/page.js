import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Patient wallet – Admin",
};

export default async function PatientWalletPage({ params, searchParams }) {
  await requireAdminOrStaffForModule("speechPatients");
  const resolvedParams =
    params != null && typeof params.then === "function" ? await params : params ?? {};
  const id = resolvedParams.id;
  if (!id) {
    return (
      <div className="space-y-4">
        <Card title="Patient wallet">
          <p className="text-sm text-slate-600">No patient selected.</p>
        </Card>
      </div>
    );
  }

  const patient = await prisma.patient.findUnique({
    where: { id },
  });

  if (!patient) {
    return (
      <div className="space-y-4">
        <Card title="Patient wallet">
          <p className="text-sm text-slate-600">Patient not found.</p>
        </Card>
      </div>
    );
  }

  const where = { patientId: id };
  const entries = await prisma.ledger.findMany({
    where,
    orderBy: { date: "desc" },
  });

  const totals = entries.reduce(
    (acc, e) => {
      acc.cr += e.cr;
      acc.dr += e.dr;
      acc.advance += e.advance;
      acc.due += e.due;
      return acc;
    },
    { cr: 0, dr: 0, advance: 0, due: 0 },
  );

  const balance = totals.cr + totals.advance - totals.dr - totals.due;

  const columns = [
    {
      key: "date",
      header: "Date",
      render: (row) => formatDateTime(row.date),
    },
    { key: "description", header: "Description" },
    { key: "cr", header: "CR" },
    { key: "dr", header: "DR" },
    { key: "advance", header: "Advance" },
    { key: "due", header: "Due" },
  ];

  const paramsObj =
    searchParams != null && typeof searchParams.then === "function"
      ? await searchParams
      : searchParams ?? {};

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">
            Wallet – {patient.patientName}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">
            All in/out amounts based on attendance and added amounts (CR / DR).
          </p>
        </div>
        <Link
          href="/admin/patients"
          className="text-xs font-medium text-sky-600 hover:underline"
        >
          ← Back to patients
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card title="Total CR">
          <p className="text-2xl font-semibold text-slate-900">
            ₹{totals.cr.toLocaleString()}
          </p>
        </Card>
        <Card title="Total DR">
          <p className="text-2xl font-semibold text-slate-900">
            ₹{totals.dr.toLocaleString()}
          </p>
        </Card>
        <Card title="Advance & due">
          <p className="text-sm text-slate-700">
            Advance: <span className="font-semibold">₹{totals.advance.toLocaleString()}</span>
          </p>
          <p className="text-sm text-slate-700">
            Due: <span className="font-semibold">₹{totals.due.toLocaleString()}</span>
          </p>
        </Card>
        <Card title="Current balance">
          <p
            className={`text-2xl font-semibold ${
              balance < 0 ? "text-rose-600" : "text-emerald-700"
            }`}
          >
            ₹{balance.toLocaleString()}
          </p>
        </Card>
      </div>

      <Card title="Wallet transactions">
        <DataTable
          columns={columns}
          data={entries}
          emptyMessage="No wallet entries for this patient yet."
          basePath={`/admin/patients/${id}/wallet`}
          searchParams={paramsObj}
          totalCount={entries.length}
          sortableColumns={["date", "cr", "dr"]}
        />
      </Card>
    </div>
  );
}


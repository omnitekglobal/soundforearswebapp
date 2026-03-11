import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

export const metadata = {
  title: "Wallet – Patient",
};

export default async function PatientWalletPage({ searchParams }) {
  await requireRole(["patient"]);
  const session = await requireSession();

  const patient = await prisma.patient.findFirst({
    where: { userId: session.userId },
  });

  if (!patient) {
    return (
      <div className="space-y-4">
        <Card title="Wallet">
          <p className="text-sm text-slate-600">
            No patient profile is linked to this account yet.
          </p>
        </Card>
      </div>
    );
  }

  const entries = await prisma.ledger.findMany({
    where: { patientId: patient.id },
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
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Wallet</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Your balance and all in/out amounts based on attendance and added amounts (CR / DR).
        </p>
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
          emptyMessage="No wallet entries yet."
          basePath="/patient/wallet"
          searchParams={paramsObj}
          totalCount={entries.length}
          sortableColumns={["date", "cr", "dr"]}
        />
      </Card>
    </div>
  );
}


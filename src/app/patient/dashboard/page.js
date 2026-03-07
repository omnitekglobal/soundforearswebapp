import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import { requireRole, requireSession } from "@/lib/auth";

export const metadata = {
  title: "Patient Dashboard",
};

export default async function PatientDashboardPage() {
  await requireRole(["patient"]);
  const session = await requireSession();

  const patient = await prisma.patient.findFirst({
    where: { userId: session.userId },
  });

  return (
    <div className="space-y-4">
      <Card title="Patient Summary">
        {patient ? (
          <dl className="grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Patient / Child
              </dt>
              <dd className="mt-0.5">
                {patient.patientName}
                {patient.childName ? ` / ${patient.childName}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Age / Sex
              </dt>
              <dd className="mt-0.5">
                {patient.age} / {patient.sex}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Services
              </dt>
              <dd className="mt-0.5">{patient.services}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Amount / Advance / Due
              </dt>
              <dd className="mt-0.5">
                ₹{patient.amount} / ₹{patient.advance} / ₹{patient.due}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-slate-600">
            No patient profile is linked to this account yet.
          </p>
        )}
      </Card>
    </div>
  );
}


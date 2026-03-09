import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { requireRole, requireSession } from "@/lib/auth";
import { formatDateTime } from "@/lib/format";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export const metadata = {
  title: "Patient Dashboard",
};

export default async function PatientDashboardPage() {
  await requireRole(["patient"]);
  const session = await requireSession();

  const patient = await prisma.patient.findFirst({
    where: { userId: session.userId },
  });

  if (!patient) {
    return (
      <div className="space-y-4">
        <Card title="Patient Dashboard">
          <p className="text-sm text-slate-600">
            No patient profile is linked to this account yet.
          </p>
        </Card>
      </div>
    );
  }

  const monthStart = startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
  const now = new Date();

  const [attendanceCount, attendanceMonth, nextTherapy, recentAttendance] =
    await Promise.all([
      prisma.attendance.count({ where: { patientId: patient.id } }),
      prisma.attendance.count({
        where: {
          patientId: patient.id,
          date: { gte: monthStart },
        },
      }),
      prisma.therapyAssignment.findFirst({
        where: {
          patientId: patient.id,
          startTime: { gt: now },
          status: "SCHEDULED",
        },
        include: { staff: true },
        orderBy: { startTime: "asc" },
      }),
      prisma.attendance.findMany({
        where: { patientId: patient.id },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

  const totalSessions = patient.noOfSessions ?? null;
  const perSession =
    totalSessions && totalSessions > 0 && patient.amount > 0
      ? Math.round(patient.amount / totalSessions)
      : null;
  const usedSessions = attendanceCount;
  const remainingSessions =
    totalSessions != null ? Math.max(0, totalSessions - usedSessions) : null;
  const remainingAmount =
    perSession != null && remainingSessions != null
      ? Math.max(0, perSession * remainingSessions)
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Welcome back. Here&apos;s your summary.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total attendance"
          value={attendanceCount}
          sub="All time"
        />
        <StatCard
          label="Last 30 days"
          value={attendanceMonth}
          sub="Attendance records"
        />
        {nextTherapy && (
          <StatCard
            label="Next session"
            value={formatDateTime(nextTherapy.startTime)}
            sub={nextTherapy.staff?.name ?? "—"}
          />
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Patient summary">
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
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Sessions (total / used / remaining)
              </dt>
              <dd className="mt-0.5">
                {totalSessions != null ? totalSessions : "—"} / {usedSessions} /{" "}
                {remainingSessions != null ? remainingSessions : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Per session / Remaining amount
              </dt>
              <dd className="mt-0.5">
                {perSession != null ? `₹${perSession}` : "—"} /{" "}
                {remainingAmount != null ? `₹${remainingAmount}` : "—"}
              </dd>
            </div>
          </dl>
        </Card>

        <Card
          title="Recent attendance"
          actions={
            <Link href="/patient/attendance" className="text-xs text-sky-600 hover:underline">
              View all
            </Link>
          }
        >
          {recentAttendance.length === 0 ? (
            <p className="text-sm text-slate-500">No attendance records yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentAttendance.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <div className="flex flex-col text-sm text-slate-700">
                    <span>{formatDateTime(r.date)}</span>
                    {perSession != null && (
                      <span className="text-xs text-slate-500">
                        Debited: ₹{perSession}
                      </span>
                    )}
                  </div>
                  {r.notes && (
                    <span className="truncate text-xs text-slate-500 max-w-[12rem]">
                      {r.notes}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {nextTherapy && (
        <Card
          title="Next therapy session"
          actions={
            <Link href="/patient/attendance" className="text-xs text-sky-600 hover:underline">
              Attendance
            </Link>
          }
        >
          <p className="text-sm text-slate-700">
            <span className="font-medium">{nextTherapy.service}</span> with{" "}
            {nextTherapy.staff?.name ?? "—"} on {formatDateTime(nextTherapy.startTime)}
          </p>
        </Card>
      )}
    </div>
  );
}

import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { requireRole, requireSession } from "@/lib/auth";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export const metadata = {
  title: "Staff Dashboard",
};

export default async function StaffDashboardPage() {
  await requireRole(["staff"]);
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });

  if (!staff) {
    return (
      <div className="space-y-4">
        <Card title="Staff Dashboard">
          <p className="text-sm text-slate-600">No staff profile linked.</p>
        </Card>
      </div>
    );
  }

  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [myAttendanceCount, myAttendanceMonth, myTherapiesToday, myTherapiesUpcoming, todayWalkIns] =
    await Promise.all([
      prisma.attendance.count({
        where: { staffId: staff.id, date: { gte: todayStart, lte: todayEnd } },
      }),
      prisma.attendance.count({
        where: {
          staffId: staff.id,
          date: { gte: startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) },
        },
      }),
      prisma.therapyAssignment.count({
        where: {
          staffId: staff.id,
          startTime: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.therapyAssignment.count({
        where: {
          staffId: staff.id,
          startTime: { gt: todayEnd },
          status: "SCHEDULED",
        },
      }),
      staff.permissions?.canAccessWalkIn
        ? prisma.walkIn.count({
            where: { date: { gte: todayStart, lte: todayEnd } },
          })
        : Promise.resolve(null),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Hello, {staff.name}. Here&apos;s your overview.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="My attendance today"
          value={myAttendanceCount}
          sub={`${myAttendanceMonth} in last 30 days`}
        />
        <StatCard
          label="Sessions today"
          value={myTherapiesToday}
          sub="Therapy assignments"
        />
        <StatCard
          label="Upcoming sessions"
          value={myTherapiesUpcoming}
          sub="Scheduled later"
        />
        {todayWalkIns != null && (
          <StatCard label="Today's walk-ins" value={todayWalkIns} sub="Clinic" />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          title="Quick links"
          actions={
            <Link href="/staff/attendance" className="text-xs text-sky-600 hover:underline">
              Attendance
            </Link>
          }
        >
          <div className="flex flex-wrap gap-2">
            <Link
              href="/staff/attendance"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              My attendance
            </Link>
            <Link
              href="/staff/therapies"
              className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
            >
              Therapies
            </Link>
            {staff.permissions?.canAccessLedger && (
              <Link
                href="/staff/ledger"
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Ledger
              </Link>
            )}
            {staff.permissions?.canAccessWalkIn && (
              <Link
                href="/staff/walkins"
                className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Walk-ins
              </Link>
            )}
          </div>
        </Card>

        <Card title="Today's sessions" actions={<Link href="/staff/therapies" className="text-xs text-sky-600 hover:underline">View all</Link>}>
          <SessionsToday staffId={staff.id} />
        </Card>
      </div>
    </div>
  );
}

async function SessionsToday({ staffId }) {
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());
  const sessions = await prisma.therapyAssignment.findMany({
    where: {
      staffId,
      startTime: { gte: todayStart, lte: todayEnd },
      status: { not: "CANCELLED" },
    },
    include: { patient: true },
    orderBy: { startTime: "asc" },
    take: 5,
  });

  if (sessions.length === 0) {
    return <p className="text-sm text-slate-500">No sessions scheduled for today.</p>;
  }

  return (
    <ul className="space-y-2">
      {sessions.map((s) => (
        <li
          key={s.id}
          className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
        >
          <span className="text-sm text-slate-700">
            {s.patient?.patientName ?? "—"} · {s.service}
          </span>
          <span className="text-xs text-slate-500">
            {new Date(s.startTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </li>
      ))}
    </ul>
  );
}

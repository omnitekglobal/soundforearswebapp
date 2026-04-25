import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { requireRole, requireSession } from "@/lib/auth";
import { effectiveStaffModuleAccess } from "@/lib/staffModuleAccess";
import { hasAnyAdminModule, getDefaultAdminEntryHref } from "@/lib/adminAccess";

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

  const access = effectiveStaffModuleAccess(staff.permissions);
  const todayStart = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  const [myAttendanceCount, myAttendanceMonth, myTherapiesToday, myTherapiesUpcoming, todayWalkIns] =
    await Promise.all([
      access.canAccessAttendance
        ? prisma.attendance.count({
            where: { staffId: staff.id, date: { gte: todayStart, lte: todayEnd } },
          })
        : Promise.resolve(0),
      access.canAccessAttendance
        ? prisma.attendance.count({
            where: {
              staffId: staff.id,
              date: { gte: startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) },
            },
          })
        : Promise.resolve(0),
      access.canAccessTherapies
        ? prisma.therapyAssignment.count({
            where: {
              staffId: staff.id,
              startTime: { gte: todayStart, lte: todayEnd },
              status: { not: "CANCELLED" },
            },
          })
        : Promise.resolve(0),
      access.canAccessTherapies
        ? prisma.therapyAssignment.count({
            where: {
              staffId: staff.id,
              startTime: { gt: todayEnd },
              status: "SCHEDULED",
            },
          })
        : Promise.resolve(0),
      access.canAccessWalkIn
        ? prisma.walkIn.count({
            where: { date: { gte: todayStart, lte: todayEnd } },
          })
        : Promise.resolve(null),
    ]);

  const hasQuick =
    access.canAccessAttendance ||
    access.canAccessTherapies ||
    access.canAccessLedger ||
    access.canAccessWalkIn;

  const firstQuickHref = access.canAccessAttendance
    ? "/staff/attendance"
    : access.canAccessTherapies
      ? "/staff/therapies"
      : access.canAccessLedger
        ? "/staff/ledger"
        : access.canAccessWalkIn
          ? "/staff/walkins"
          : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Hello, {staff.name}. Here&apos;s your overview.
        </p>
      </div>

      {hasAnyAdminModule(staff.permissions) && (
        <div className="rounded-lg border border-amber-200/90 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 shadow-sm">
          <span className="font-medium">Clinic admin access</span>
          <span className="text-amber-900/90">
            {" "}
            You are allowed to use selected admin pages. The sidebar in the admin app
            only shows what is enabled for your account.{" "}
          </span>
          <Link
            href={getDefaultAdminEntryHref(staff.permissions)}
            className="font-medium text-amber-900 underline decoration-amber-700/50 hover:decoration-amber-900"
          >
            Open admin app
          </Link>
        </div>
      )}

      {(access.canAccessAttendance ||
        access.canAccessTherapies ||
        todayWalkIns != null) && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {access.canAccessAttendance && (
            <StatCard
              label="My attendance today"
              value={myAttendanceCount}
              sub={`${myAttendanceMonth} in last 30 days`}
            />
          )}
          {access.canAccessTherapies && (
            <StatCard
              label="Sessions today"
              value={myTherapiesToday}
              sub="Therapy assignments"
            />
          )}
          {access.canAccessTherapies && (
            <StatCard
              label="Upcoming sessions"
              value={myTherapiesUpcoming}
              sub="Scheduled later"
            />
          )}
          {todayWalkIns != null && (
            <StatCard label="Today's walk-ins" value={todayWalkIns} sub="Clinic" />
          )}
        </div>
      )}

      <div
        className={
          hasQuick && access.canAccessTherapies
            ? "grid gap-4 sm:grid-cols-2"
            : "grid gap-4 sm:grid-cols-1"
        }
      >
        {hasQuick && (
          <Card
            title="Quick links"
            actions={
              firstQuickHref ? (
                <Link
                  href={firstQuickHref}
                  className="text-xs text-sky-600 hover:underline"
                >
                  Open
                </Link>
              ) : null
            }
          >
            <div className="flex flex-wrap gap-2">
              {access.canAccessAttendance && (
                <Link
                  href="/staff/attendance"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  My attendance
                </Link>
              )}
              {access.canAccessTherapies && (
                <Link
                  href="/staff/therapies"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Therapies
                </Link>
              )}
              {access.canAccessLedger && (
                <Link
                  href="/staff/ledger"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Ledger
                </Link>
              )}
              {access.canAccessWalkIn && (
                <Link
                  href="/staff/walkins"
                  className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                >
                  Walk-ins
                </Link>
              )}
            </div>
          </Card>
        )}

        {access.canAccessTherapies && (
          <Card
            title="Today's sessions"
            actions={
              <Link href="/staff/therapies" className="text-xs text-sky-600 hover:underline">
                View all
              </Link>
            }
          >
            <SessionsToday staffId={staff.id} />
          </Card>
        )}

        {!hasQuick && !access.canAccessTherapies && (
          <Card title="Modules">
            <p className="text-sm text-slate-600">
              You don&apos;t have any clinic modules enabled yet. Ask an admin to
              turn on the areas you need under Staff → module access.
            </p>
          </Card>
        )}
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

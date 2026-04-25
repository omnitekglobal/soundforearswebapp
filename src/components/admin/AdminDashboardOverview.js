import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { requireAdminOrStaffForModule } from "@/lib/adminAccess";

function startOfDayIST(date = new Date()) {
  // IST = UTC+5:30. Get today's midnight in IST as a UTC Date.
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(date.getTime() + IST_OFFSET_MS);
  // Zero out to midnight in IST
  istNow.setUTCHours(0, 0, 0, 0);
  // Convert back to UTC
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

function endOfDayIST(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(date.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(23, 59, 59, 999);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

export default async function AdminDashboardOverview() {
  await requireAdminOrStaffForModule("dashboard");

  const todayStart = startOfDayIST();
  const todayEnd = endOfDayIST();
  const thirtyDaysAgo = startOfDayIST(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [
    totalPatients,
    totalStaff,
    todayAttendance,
    monthAttendance,
    todayWalkIns,
    ledgerToday,
    ledgerMonth,
    therapiesToday,
    recentLedger,
    patientsForBilling,
    attendanceByPatient,
  ] = await Promise.all([
    prisma.patient.count(),
    prisma.staff.count({ where: { isActive: true } }),
    prisma.attendance.count({
      where: { date: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.attendance.count({
      where: { date: { gte: thirtyDaysAgo } },
    }),
    prisma.walkIn.count({
      where: { createdAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.ledger.aggregate({
      where: { date: { gte: todayStart, lte: todayEnd } },
      _sum: { cr: true, dr: true, advance: true },
    }),
    prisma.ledger.aggregate({
      where: { date: { gte: thirtyDaysAgo } },
      _sum: { cr: true, dr: true },
    }),
    prisma.therapyAssignment.count({
      where: {
        startTime: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
    }),
    prisma.ledger.findMany({
      take: 5,
      orderBy: { date: "desc" },
      include: { patient: true },
    }),
    prisma.patient.findMany({
      select: { id: true, amount: true, noOfSessions: true, perSessionCharge: true },
    }),
    prisma.attendance.groupBy({
      by: ["patientId"],
      where: { patientId: { not: null } },
      _count: { _all: true },
    }),
  ]);

  const todayCr = ledgerToday._sum.cr ?? 0;
  const todayDr = ledgerToday._sum.dr ?? 0;
  const monthCr = ledgerMonth._sum.cr ?? 0;
  const monthDr = ledgerMonth._sum.dr ?? 0;

  const attendanceCountMap = new Map();
  for (const group of attendanceByPatient) {
    if (!group.patientId) continue;
    attendanceCountMap.set(group.patientId, group._count._all);
  }

  let totalPackageAmount = 0;
  let totalRemainingAmount = 0;
  for (const p of patientsForBilling) {
    if (!p.noOfSessions || p.noOfSessions <= 0) continue;
    const perSession =
      p.perSessionCharge && p.perSessionCharge > 0
        ? p.perSessionCharge
        : p.amount && p.amount > 0
          ? Math.round(p.amount / p.noOfSessions)
          : null;
    if (!perSession) continue;

    if (p.amount && p.amount > 0) {
      totalPackageAmount += p.amount;
    }

    const usedSessions = attendanceCountMap.get(p.id) ?? 0;
    const remainingSessions = p.noOfSessions - usedSessions;
    const remainingAmount =
      p.amount && p.amount > 0
        ? p.amount - perSession * usedSessions
        : perSession * remainingSessions;

    totalRemainingAmount += remainingAmount;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Clinic overview and today&apos;s snapshot
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total patients" value={totalPatients} sub="Registered" />
        <StatCard label="Active staff" value={totalStaff} sub="Team" />
        <StatCard
          label="Today's attendance"
          value={todayAttendance}
          sub={`${monthAttendance} in last 30 days`}
        />
        <StatCard label="Today's patients" value={todayWalkIns} sub="Visitors" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's sell"
          value={`₹${todayCr.toLocaleString()}`}
          sub="From ledger"
        />
        <StatCard
          label="Today's expense"
          value={`₹${todayDr.toLocaleString()}`}
          sub="From ledger"
        />
        <StatCard
          label="Sessions today"
          value={therapiesToday}
          sub="Therapy assignments"
        />
        <StatCard
          label="30-day CR"
          value={`₹${monthCr.toLocaleString()}`}
          sub={`DR: ₹${monthDr.toLocaleString()}`}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total package amount"
          value={`₹${totalPackageAmount.toLocaleString()}`}
          sub="All patients"
        />
        <StatCard
          label="Remaining package amount"
          value={`₹${totalRemainingAmount.toLocaleString()}`}
          sub="Based on sessions"
        />
      </div>

      {/* Quick links & recent ledger */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Quick links" actions={<Link href="/admin/patients" className="text-xs text-sky-600 hover:underline">View all</Link>}>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/patients" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Patients</Link>
            <Link href="/admin/staff" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Staff</Link>
            <Link href="/admin/attendance" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Attendance</Link>
            <Link href="/admin/therapies" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Therapies</Link>
            <Link href="/admin/ledger" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Ledger</Link>
            <Link href="/admin/walkins" className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200">Walk-ins</Link>
          </div>
        </Card>

        <Card
          title="Recent ledger entries"
          actions={
            <Link href="/admin/ledger" className="text-xs text-sky-600 hover:underline">
              View all
            </Link>
          }
        >
          {recentLedger.length === 0 ? (
            <p className="text-sm text-slate-500">No ledger entries yet.</p>
          ) : (
            <ul className="space-y-2">
              {recentLedger.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 last:border-0 last:pb-0"
                >
                  <span className="truncate text-sm text-slate-700">
                    {entry.description}
                    {entry.patient && (
                      <span className="ml-1 text-slate-500">
                        ({entry.patient.patientName})
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs font-medium text-slate-600">
                    ₹{entry.cr - entry.dr}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
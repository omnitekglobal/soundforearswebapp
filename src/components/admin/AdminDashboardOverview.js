import Link from "next/link";
import prisma from "@/lib/prisma";
import Card from "@/components/ui/Card";
import StatCard from "@/components/ui/StatCard";
import { getSession } from "@/lib/auth";
import {
  requireAdminOrStaffForModule,
  hasAdminModule,
  getAdminQuickLinkItems,
} from "@/lib/adminAccess";

function startOfDayIST(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(date.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(0, 0, 0, 0);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

function endOfDayIST(date = new Date()) {
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(date.getTime() + IST_OFFSET_MS);
  istNow.setUTCHours(23, 59, 59, 999);
  return new Date(istNow.getTime() - IST_OFFSET_MS);
}

const emptySum = { _sum: { cr: null, dr: null, advance: null } };

export default async function AdminDashboardOverview() {
  await requireAdminOrStaffForModule("dashboard");

  const session = await getSession();
  const isFullAdmin = session?.role === "admin";
  const staffPerms = !isFullAdmin
    ? (
        await prisma.staff.findFirst({
          where: { userId: session.userId },
          include: { permissions: true },
        })
      )?.permissions
    : null;

  const can = (key) => isFullAdmin || hasAdminModule(staffPerms, key);

  const qPatients = can("normalPatients") || can("speechPatients");
  const qStaff = can("staff");
  const qAttendance = can("attendance");
  const qWalkins = can("walkins");
  const qLedgerFin = can("ledger") || can("sales") || can("payouts");
  const qTherapies = can("therapies");
  const qRecentLedger = can("ledger");
  const qPackage = qPatients;
  const qAttForPackage = can("attendance") && qPackage;

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
    qPatients ? prisma.patient.count() : Promise.resolve(0),
    qStaff
      ? prisma.staff.count({ where: { isActive: true } })
      : Promise.resolve(0),
    qAttendance
      ? prisma.attendance.count({
          where: { date: { gte: todayStart, lte: todayEnd } },
        })
      : Promise.resolve(0),
    qAttendance
      ? prisma.attendance.count({
          where: { date: { gte: thirtyDaysAgo } },
        })
      : Promise.resolve(0),
    qWalkins
      ? prisma.walkIn.count({
          where: { createdAt: { gte: todayStart, lte: todayEnd } },
        })
      : Promise.resolve(0),
    qLedgerFin
      ? prisma.ledger.aggregate({
          where: { date: { gte: todayStart, lte: todayEnd } },
          _sum: { cr: true, dr: true, advance: true },
        })
      : Promise.resolve(emptySum),
    qLedgerFin
      ? prisma.ledger.aggregate({
          where: { date: { gte: thirtyDaysAgo } },
          _sum: { cr: true, dr: true },
        })
      : Promise.resolve(emptySum),
    qTherapies
      ? prisma.therapyAssignment.count({
          where: {
            startTime: { gte: todayStart, lte: todayEnd },
            status: { not: "CANCELLED" },
          },
        })
      : Promise.resolve(0),
    qRecentLedger
      ? prisma.ledger.findMany({
          take: 5,
          orderBy: { date: "desc" },
          include: { patient: true },
        })
      : Promise.resolve([]),
    qPackage
      ? prisma.patient.findMany({
          select: {
            id: true,
            amount: true,
            noOfSessions: true,
            perSessionCharge: true,
          },
        })
      : Promise.resolve([]),
    qAttForPackage
      ? prisma.attendance.groupBy({
          by: ["patientId"],
          where: { patientId: { not: null } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
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

  const quickLinkItems = getAdminQuickLinkItems(isFullAdmin, staffPerms);
  const hasStatsRow1 = qPatients || qStaff || qAttendance || qWalkins;
  const hasStatsRow2 = qLedgerFin || qTherapies;
  const hasStatsRow3 = qPackage;

  const firstQuickHref = quickLinkItems[0]?.href ?? null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Clinic overview and today&apos;s snapshot
        </p>
        {!isFullAdmin && (
          <p className="mt-1 text-xs text-amber-800/90">
            Numbers and links below only include admin areas you are allowed to use.
          </p>
        )}
      </div>

      {hasStatsRow1 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {qPatients && (
            <StatCard label="Total patients" value={totalPatients} sub="Registered" />
          )}
          {qStaff && <StatCard label="Active staff" value={totalStaff} sub="Team" />}
          {qAttendance && (
            <StatCard
              label="Today's attendance"
              value={todayAttendance}
              sub={`${monthAttendance} in last 30 days`}
            />
          )}
          {qWalkins && (
            <StatCard
              label="Today's patients"
              value={todayWalkIns}
              sub="Visitors (walk-ins)"
            />
          )}
        </div>
      )}

      {hasStatsRow2 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {qLedgerFin && (
            <>
              <StatCard
                label="Today's sell"
                value={`₹${Number(todayCr).toLocaleString()}`}
                sub="From ledger"
              />
              <StatCard
                label="Today's expense"
                value={`₹${Number(todayDr).toLocaleString()}`}
                sub="From ledger"
              />
              <StatCard
                label="30-day CR"
                value={`₹${Number(monthCr).toLocaleString()}`}
                sub={`DR: ₹${Number(monthDr).toLocaleString()}`}
              />
            </>
          )}
          {qTherapies && (
            <StatCard
              label="Sessions today"
              value={therapiesToday}
              sub="Therapy assignments"
            />
          )}
        </div>
      )}

      {hasStatsRow3 && (
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
      )}

      {!isFullAdmin && !hasStatsRow1 && !hasStatsRow2 && !hasStatsRow3 && (
        <p className="text-sm text-slate-600">
          You can open the admin app, but you only have the dashboard for now. Use the
          sidebar to go to any other page your administrator has turned on, or ask them
          to add more &quot;Clinic admin&quot; modules to your user.
        </p>
      )}

      {(quickLinkItems.length > 0 || qRecentLedger) && (
        <div
          className={`grid gap-4 ${
            quickLinkItems.length > 0 && qRecentLedger ? "lg:grid-cols-2" : "grid-cols-1"
          }`}
        >
          {quickLinkItems.length > 0 && (
            <Card
              title="Quick links"
              actions={
                firstQuickHref ? (
                  <Link
                    href={firstQuickHref}
                    className="text-xs text-sky-600 hover:underline"
                  >
                    Open first
                  </Link>
                ) : null
              }
            >
              <div className="flex flex-wrap gap-2">
                {quickLinkItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {qRecentLedger && (
            <Card
              title="Recent ledger entries"
              actions={
                <Link
                  href="/admin/ledger"
                  className="text-xs text-sky-600 hover:underline"
                >
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
          )}
        </div>
      )}
    </div>
  );
}

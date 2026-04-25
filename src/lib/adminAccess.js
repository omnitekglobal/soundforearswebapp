import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSession, requireSession } from "@/lib/auth";

/** Prisma `Permission` field names for clinic admin (non–staff-portal) areas. */
export const ADMIN_MODULE_FIELDS = {
  dashboard: "canAccessAdminDashboard",
  normalPatients: "canAccessAdminNormalPatients",
  speechPatients: "canAccessAdminSpeechPatients",
  staff: "canAccessAdminStaff",
  attendance: "canAccessAdminAttendance",
  therapies: "canAccessAdminTherapies",
  sales: "canAccessAdminSales",
  payouts: "canAccessAdminPayouts",
  ledger: "canAccessAdminLedger",
  walkins: "canAccessAdminWalkins",
};

export function hasAdminModule(permissions, moduleKey) {
  const field = ADMIN_MODULE_FIELDS[moduleKey];
  if (!field) return false;
  if (!permissions) return false;
  return Boolean(permissions[field]);
}

export function hasAnyAdminModule(permissions) {
  if (!permissions) return false;
  return Object.values(ADMIN_MODULE_FIELDS).some((f) => permissions[f]);
}

/** Same order as the admin sidebar; used for full admins and quick-link parity. */
export const FULL_ADMIN_NAV_ITEMS = [
  { label: "Dashboard", href: "/admin/dashboard" },
  { label: "Normal patients", href: "/admin/normal-patients" },
  { label: "Speech therapy patients", href: "/admin/patients" },
  { label: "Staff", href: "/admin/staff" },
  { label: "Attendance", href: "/admin/attendance" },
  { label: "Therapies", href: "/admin/therapies" },
  { label: "Sales", href: "/admin/ledger/sales" },
  { label: "Payouts", href: "/admin/ledger/payouts" },
  { label: "Ledger", href: "/admin/ledger" },
  { label: "Walk-ins", href: "/admin/walkins" },
];

/**
 * @param {import("@prisma/client").Permission | null} permissions
 */
export function buildAdminNavItemsForPermissions(permissions) {
  if (!hasAnyAdminModule(permissions)) return [];
  const out = [];
  if (hasAdminModule(permissions, "dashboard")) {
    out.push({ label: "Dashboard", href: "/admin/dashboard" });
  }
  if (hasAdminModule(permissions, "normalPatients")) {
    out.push({ label: "Normal patients", href: "/admin/normal-patients" });
  }
  if (hasAdminModule(permissions, "speechPatients")) {
    out.push({ label: "Speech therapy patients", href: "/admin/patients" });
  }
  if (hasAdminModule(permissions, "staff")) {
    out.push({ label: "Staff", href: "/admin/staff" });
  }
  if (hasAdminModule(permissions, "attendance")) {
    out.push({ label: "Attendance", href: "/admin/attendance" });
  }
  if (hasAdminModule(permissions, "therapies")) {
    out.push({ label: "Therapies", href: "/admin/therapies" });
  }
  if (hasAdminModule(permissions, "sales")) {
    out.push({ label: "Sales", href: "/admin/ledger/sales" });
  }
  if (hasAdminModule(permissions, "payouts")) {
    out.push({ label: "Payouts", href: "/admin/ledger/payouts" });
  }
  if (hasAdminModule(permissions, "ledger")) {
    out.push({ label: "Ledger", href: "/admin/ledger" });
  }
  if (hasAdminModule(permissions, "walkins")) {
    out.push({ label: "Walk-ins", href: "/admin/walkins" });
  }
  return out;
}

/**
 * @param {import("@prisma/client").Permission | null} permissions
 */
export function countAdminModulesEnabled(permissions) {
  if (!permissions) return 0;
  return Object.values(ADMIN_MODULE_FIELDS).filter((f) => permissions[f]).length;
}

/**
 * Shortcuts on the admin home (excludes dashboard; respects assigned modules for staff).
 */
export function getAdminQuickLinkItems(isFullAdmin, permissions) {
  if (isFullAdmin) {
    return FULL_ADMIN_NAV_ITEMS.filter((i) => i.href !== "/admin/dashboard");
  }
  return buildAdminNavItemsForPermissions(permissions).filter(
    (i) => i.href !== "/admin/dashboard"
  );
}

/**
 * First admin URL this user should use when opening the clinic admin app from the staff app.
 */
export function getDefaultAdminEntryHref(permissions) {
  const items = buildAdminNavItemsForPermissions(permissions);
  return items[0]?.href ?? "/admin/dashboard";
}

/**
 * Full admins bypass; staff must have the given admin module. Others redirect to login.
 */
export async function requireAdminOrStaffForModule(moduleKey) {
  const session = await requireSession();
  if (session.role === "admin") return { session, staff: null };
  if (session.role === "staff") {
    const staff = await prisma.staff.findFirst({
      where: { userId: session.userId },
      include: { permissions: true },
    });
    if (hasAdminModule(staff?.permissions, moduleKey)) {
      return { session, staff };
    }
  }
  redirect(
    session.role === "patient" ? "/patient/dashboard" : "/staff/dashboard"
  );
}

function patientTypeToModuleKey(patientType) {
  return patientType === "normal" ? "normalPatients" : "speechPatients";
}

/**
 * @param {string} patientType DB value, e.g. "normal" | "therapy"
 */
export async function requireAdminOrStaffForPatientType(patientType) {
  await requireAdminOrStaffForModule(patientTypeToModuleKey(patientType));
}

/**
 * For patient update when type may change: staff must be allowed for both old and new type.
 * @param {string} previousType
 * @param {string} nextType
 */
export async function requireAdminOrStaffForPatientTypes(previousType, nextType) {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") return;
  if (session.role !== "staff") {
    redirect("/login");
  }
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });
  const prev = patientTypeToModuleKey(previousType);
  const next = patientTypeToModuleKey(nextType);
  if (hasAdminModule(staff?.permissions, prev) && hasAdminModule(staff?.permissions, next)) {
    return;
  }
  redirect("/staff/dashboard");
}

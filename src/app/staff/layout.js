import RoleSidebarLayout from "@/components/layout/RoleSidebarLayout";
import { requireSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { effectiveStaffModuleAccess } from "@/lib/staffModuleAccess";

export const metadata = {
  title: "Staff – Sound For Ears",
};

export default async function StaffLayout({ children }) {
  const session = await requireSession();
  const staff = await prisma.staff.findFirst({
    where: { userId: session.userId },
    include: { permissions: true },
  });
  if (!staff) {
    return <RoleSidebarLayout role="staff">{children}</RoleSidebarLayout>;
  }
  const a = effectiveStaffModuleAccess(staff.permissions);
  const items = [
    { label: "Dashboard", href: "/staff/dashboard" },
    ...(a.canAccessAttendance
      ? [{ label: "Attendance", href: "/staff/attendance" }]
      : []),
    ...(a.canAccessTherapies
      ? [{ label: "Therapies", href: "/staff/therapies" }]
      : []),
    ...(a.canAccessLedger ? [{ label: "Ledger", href: "/staff/ledger" }] : []),
    ...(a.canAccessWalkIn
      ? [{ label: "Walk-ins", href: "/staff/walkins" }]
      : []),
  ];
  return (
    <RoleSidebarLayout role="staff" items={items}>
      {children}
    </RoleSidebarLayout>
  );
}


import { redirect } from "next/navigation";
import RoleSidebarLayout from "@/components/layout/RoleSidebarLayout";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  hasAnyAdminModule,
  buildAdminNavItemsForPermissions,
} from "@/lib/adminAccess";

export const metadata = {
  title: "Admin – Sound For Ears",
};

export default async function AdminLayout({ children }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  if (session.role === "patient") {
    redirect("/patient/dashboard");
  }
  if (session.role === "admin") {
    return <RoleSidebarLayout role="admin">{children}</RoleSidebarLayout>;
  }
  if (session.role === "staff") {
    const staff = await prisma.staff.findFirst({
      where: { userId: session.userId },
      include: { permissions: true },
    });
    if (!hasAnyAdminModule(staff?.permissions)) {
      redirect("/staff/dashboard");
    }
    const items = buildAdminNavItemsForPermissions(staff?.permissions);
    if (items.length === 0) {
      redirect("/staff/dashboard");
    }
    return (
      <RoleSidebarLayout
        role="admin"
        userLabel="Clinic staff (admin access)"
        items={items}
      >
        {children}
      </RoleSidebarLayout>
    );
  }
  redirect("/");
}


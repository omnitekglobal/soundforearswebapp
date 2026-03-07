import RoleSidebarLayout from "@/components/layout/RoleSidebarLayout";

export const metadata = {
  title: "Staff – Sound For Ears",
};

export default function StaffLayout({ children }) {
  return <RoleSidebarLayout role="staff">{children}</RoleSidebarLayout>;
}


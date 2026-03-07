import RoleSidebarLayout from "@/components/layout/RoleSidebarLayout";

export const metadata = {
  title: "Admin – Sound For Ears",
};

export default function AdminLayout({ children }) {
  return (
    <RoleSidebarLayout role="admin">
      {children}
    </RoleSidebarLayout>
  );
}


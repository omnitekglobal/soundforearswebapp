import RoleSidebarLayout from "@/components/layout/RoleSidebarLayout";

export const metadata = {
  title: "Patient – Sound For Ears",
};

export default function PatientLayout({ children }) {
  return <RoleSidebarLayout role="patient">{children}</RoleSidebarLayout>;
}


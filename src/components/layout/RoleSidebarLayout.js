import SidebarNav from "./SidebarNav";

const navByRole = {
  admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Patients", href: "/admin/patients" },
    { label: "Staff", href: "/admin/staff" },
    { label: "Attendance", href: "/admin/attendance" },
    { label: "Ledger", href: "/admin/ledger" },
    { label: "Walk-ins", href: "/admin/walkins" },
  ],
  staff: [
    { label: "Dashboard", href: "/staff/dashboard" },
    { label: "Attendance", href: "/staff/attendance" },
    { label: "Therapies", href: "/staff/therapies" },
    { label: "Ledger", href: "/staff/ledger" },
    { label: "Walk-ins", href: "/staff/walkins" },
  ],
  patient: [
    { label: "Dashboard", href: "/patient/dashboard" },
    { label: "Attendance", href: "/patient/attendance" },
  ],
};

function getRoleLabel(role) {
  if (role === "admin") return "Clinic Admin";
  if (role === "staff") return "Clinic Staff";
  if (role === "patient") return "Patient Portal";
  return "Sound For Ears";
}

export default function RoleSidebarLayout({ role, children }) {
  const navItems = navByRole[role] ?? [];
  const roleLabel = getRoleLabel(role);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 shadow-sm lg:hidden">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">
            Sound For Ears
          </div>
          <div className="mt-0.5 text-sm font-medium text-slate-900">
            {roleLabel}
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <div className="border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
        <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          <SidebarNav items={navItems} orientation="horizontal" />
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl gap-6 px-4 py-6 lg:px-8 lg:py-8">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 flex-none border-r border-slate-200 bg-white/80 px-4 py-6 shadow-sm lg:block">
          <div className="mb-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-sky-600">
              Sound For Ears
            </div>
            <div className="mt-1 text-sm font-medium text-slate-900">
              {roleLabel}
            </div>
          </div>
          <SidebarNav items={navItems} orientation="vertical" />
        </aside>

        {/* Main content */}
        <main className="flex-1">
          <div className="space-y-4">{children}</div>
        </main>
      </div>
    </div>
  );
}


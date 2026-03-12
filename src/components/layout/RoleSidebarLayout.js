import SidebarNav from "./SidebarNav";
import { logoutAction } from "@/app/(auth)/logout/actions";

const navByRole = {
  admin: [
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
    { label: "Wallet", href: "/patient/wallet" },
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
      <header className="flex min-h-[3.5rem] items-center justify-between gap-2 border-b border-slate-200 bg-white/80 px-3 py-2.5 shadow-sm sm:px-4 sm:py-3 lg:hidden">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-semibold uppercase tracking-wide text-sky-600">
            Sound For Ears
          </div>
          <div className="truncate text-sm font-medium text-slate-900">
            {roleLabel}
          </div>
        </div>
        <form action={logoutAction} className="shrink-0">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 active:bg-slate-100 min-h-[2.5rem] sm:py-1.5"
          >
            Log out
          </button>
        </form>
      </header>

      <div className="flex flex-col gap-4 px-3 py-4 pb-24 sm:px-4 sm:py-6 lg:flex-row lg:gap-6 lg:px-8 lg:py-8 lg:pb-8">
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
          <div className="mt-6 border-t border-slate-200 pt-4">
            <form action={logoutAction}>
              <button
                type="submit"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Log out
              </button>
            </form>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1">
          <div className="space-y-4 overflow-x-hidden">{children}</div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed inset-x-0 bottom-0 h-16 border-t border-slate-200 bg-white/95 px-3 shadow-[0_-4px_14px_rgba(15,23,42,0.15)] backdrop-blur lg:hidden">
        <div className="no-scrollbar flex h-full items-center justify-between gap-2 overflow-x-auto">
          <SidebarNav items={navItems} orientation="horizontal" />
        </div>
      </div>
    </div>
  );
}


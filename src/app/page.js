import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-3xl rounded-3xl bg-white/90 px-6 py-8 shadow-lg ring-1 ring-slate-200/80 sm:px-10 sm:py-12">
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] md:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-600">
              Sound For Ears
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Clinic Management Web App
            </h1>
            <p className="mt-3 text-sm text-slate-600 sm:text-[0.95rem]">
              Multi-role clinic management system for admins, staff and
              patients. Track attendance, therapies, ledger, and daily walk-ins
              in one clean dashboard.
            </p>
            <div className="mt-6 space-y-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
              <Link
                href="/login"
                className="inline-flex w-full items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 sm:w-auto"
              >
                Go to Login
              </Link>
              <p className="text-xs text-slate-500 sm:text-[0.8rem]">
                Role-based dashboards for clinic admin, staff, and patients.
              </p>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-2xl border border-dashed border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-800 shadow-inner">
              <p className="font-semibold tracking-tight">
                Today&apos;s Clinic Snapshot
              </p>
              <ul className="mt-3 space-y-2">
                <li className="flex items-start justify-between gap-3">
                  <span>Patients scheduled</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-sky-700 shadow-sm">
                    18
                  </span>
                </li>
                <li className="flex items-start justify-between gap-3">
                  <span>Active therapists</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-sky-700 shadow-sm">
                    6
                  </span>
                </li>
                <li className="flex items-start justify-between gap-3">
                  <span>Today&apos;s walk-ins</span>
                  <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-sky-700 shadow-sm">
                    4
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

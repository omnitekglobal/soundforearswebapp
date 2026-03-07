export default function StatCard({ label, value, sub, icon: Icon, className = "" }) {
  return (
    <div
      className={`min-w-0 rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm sm:p-4 ${className}`}
    >
      <div className="flex min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-1 truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
          {sub != null && sub !== "" && (
            <p className="mt-0.5 truncate text-xs text-slate-500">{sub}</p>
          )}
        </div>
        {Icon && (
          <div className="shrink-0 rounded-lg bg-sky-50 p-2 text-sky-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

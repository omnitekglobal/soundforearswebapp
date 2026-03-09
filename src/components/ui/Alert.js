"use client";

export default function Alert({ type = "info", title, children }) {
  const isError = type === "error";
  const isWarning = type === "warning";

  const base =
    "w-full rounded-lg border px-3 py-2.5 text-sm sm:px-4 sm:py-3 flex items-start gap-2";

  const colorClasses = isError
    ? "border-red-200 bg-red-50 text-red-800"
    : isWarning
      ? "border-amber-200 bg-amber-50 text-amber-800"
      : "border-sky-200 bg-sky-50 text-sky-800";

  return (
    <div className={`${base} ${colorClasses}`}>
      <div className="mt-0.5 text-base leading-none">
        {isError ? "⚠️" : isWarning ? "!" : "ℹ️"}
      </div>
      <div className="space-y-0.5">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div>{children}</div>}
      </div>
    </div>
  );
}


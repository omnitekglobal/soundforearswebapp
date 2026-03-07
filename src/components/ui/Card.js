export default function Card({ title, children, actions, className = "" }) {
  return (
    <section
      className={`rounded-xl bg-white/90 p-3 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm sm:rounded-2xl sm:p-5 ${className}`}
    >
      <div className="mb-3 flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        {title ? (
          <h2 className="min-w-0 truncate text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            {title}
          </h2>
        ) : (
          <span />
        )}
        {actions ? (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2">
            {actions}
          </div>
        ) : null}
      </div>
      <div className="min-w-0 text-sm leading-relaxed text-slate-700 sm:text-[0.95rem]">
        {children}
      </div>
    </section>
  );
}


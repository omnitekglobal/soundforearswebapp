export default function Card({ title, children, actions, className = "" }) {
  return (
    <section
      className={`rounded-2xl bg-white/90 p-4 shadow-sm ring-1 ring-slate-200/80 backdrop-blur-sm sm:p-5 ${className}`}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        {title ? (
          <h2 className="text-sm font-semibold tracking-tight text-slate-900 sm:text-base">
            {title}
          </h2>
        ) : (
          <span />
        )}
        {actions ? (
          <div className="flex flex-wrap items-center gap-2">{actions}</div>
        ) : null}
      </div>
      <div className="text-sm leading-relaxed text-slate-700 sm:text-[0.95rem]">
        {children}
      </div>
    </section>
  );
}


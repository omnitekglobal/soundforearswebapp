"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function Icon({ href, isActive }) {
  const common = "h-7 w-7";
  const stroke = isActive ? "#0ea5e9" : "#64748b";

  if (href.includes("/dashboard")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1v-9.5Z"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (href.includes("/normal-patients") || href.includes("/patients")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <path
          d="M8.5 12a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm7 0a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M3.5 19.5c0-2.485 2.239-4.5 5-4.5h1c2.761 0 5 2.015 5 4.5M12 15h1c2.761 0 5 2.015 5 4.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (href.includes("/staff")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <circle
          cx="12"
          cy="8"
          r="3.2"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
        />
        <path
          d="M6 19.5c.5-2.5 2.7-4 6-4s5.5 1.5 6 4"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (href.includes("/attendance")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <rect
          x="3.5"
          y="4"
          width="17"
          height="16.5"
          rx="2"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
        />
        <path
          d="M8 3v3M16 3v3M4 9h16"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (href.includes("/therap")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <path
          d="M5 19.5 9.5 4.5 14 19.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M3.5 15h11M17 8.5 20.5 12 17 15.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (href.includes("/ledger") || href.includes("/wallet")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <rect
          x="3.5"
          y="5"
          width="17"
          height="14"
          rx="2.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
        />
        <path
          d="M15 12.5h4M8.5 11a2.5 2.5 0 1 0 0 5h4"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (href.includes("/walkins")) {
    return (
      <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
        <path
          d="M7 20.5 9.5 13l-2-3.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13 4.5h4l-1 9.5-3.5 2-2-3.5"
          fill="none"
          stroke={stroke}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={common} aria-hidden="true">
      <circle
        cx="12"
        cy="12"
        r="7.5"
        fill="none"
        stroke={stroke}
        strokeWidth="1.7"
      />
    </svg>
  );
}

export default function SidebarNav({ items, orientation = "vertical" }) {
  const pathname = usePathname();

  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      className={
        isHorizontal
          ? "flex flex-row gap-4 text-[0.7rem] sm:text-xs"
          : "space-y-1 text-sm"
      }
    >
      {items.map((item) => {
        const isActive = pathname === item.href;

        const baseClasses = isHorizontal
          ? "flex flex-col items-center justify-center rounded-2xl px-3.5 py-2.5 text-[0.75rem] font-medium transition min-w-[4.1rem]"
          : "flex items-center whitespace-nowrap rounded-xl px-3.5 py-3.5 font-medium transition min-h-[3.1rem] sm:py-1.5 sm:min-h-0";

        const activeClasses = isHorizontal
          ? "text-sky-600"
          : "bg-sky-50 text-sky-700 ring-1 ring-sky-100";

        const inactiveClasses = isHorizontal
          ? "text-slate-500 hover:text-slate-800"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${baseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            <Icon href={item.href} isActive={isActive} />
            {isHorizontal ? (
              <span className="mt-0.5 truncate text-[0.7rem]">
                {item.label}
              </span>
            ) : (
              <span className="ml-2 truncate">{item.label}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}


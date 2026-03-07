"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SidebarNav({ items, orientation = "vertical" }) {
  const pathname = usePathname();

  const isHorizontal = orientation === "horizontal";

  return (
    <nav
      className={
        isHorizontal
          ? "flex flex-row gap-2 text-xs sm:text-sm"
          : "space-y-1 text-sm"
      }
    >
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname.startsWith(item.href));

        const baseClasses =
          "flex items-center whitespace-nowrap rounded-full px-3 py-2.5 font-medium transition min-h-[2.75rem] sm:py-1.5 sm:min-h-0";

        const activeClasses = isHorizontal
          ? "bg-sky-600 text-white shadow-sm"
          : "bg-sky-50 text-sky-700 ring-1 ring-sky-100";

        const inactiveClasses = isHorizontal
          ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
          : "text-slate-700 hover:bg-slate-50 hover:text-slate-900";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`${baseClasses} ${
              isActive ? activeClasses : inactiveClasses
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}


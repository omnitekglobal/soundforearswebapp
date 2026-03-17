"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function RouteTransitionLoader({ children }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isFirstRender = useRef(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 450);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  return (
    <>
      {isLoading ? (
        <div className="fixed inset-0 z-[9999] flex min-h-screen items-center justify-center bg-slate-50/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div
              className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-sky-600"
              aria-label="Loading"
              role="status"
            />
            <p className="text-sm font-medium text-slate-700">Loading page...</p>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}

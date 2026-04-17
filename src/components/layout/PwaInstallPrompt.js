"use client";

import { useCallback, useEffect, useState } from "react";

const DISMISS_KEY = "soundforears-pwa-install-dismissed";

export default function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined" && window.localStorage.getItem(DISMISS_KEY)) {
        setDismissed(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(standalone);
    setIsIos(/iPad|iPhone|iPod/.test(navigator.userAgent));

    const onBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onAppInstalled = () => {
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const onInstallClick = useCallback(async () => {
    if (!installEvent) return;
    installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }, [installEvent]);

  if (isStandalone || dismissed) return null;

  if (installEvent) {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:justify-end"
        role="region"
        aria-label="Install app"
      >
        <div className="pointer-events-auto flex max-w-md items-center gap-2 rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:px-4">
          <p className="hidden text-xs text-slate-600 sm:block sm:max-w-[14rem] sm:text-sm">
            Install for quick access and offline-friendly loading.
          </p>
          <button
            type="button"
            onClick={onInstallClick}
            className="shrink-0 rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          >
            Install app
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-full px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Dismiss install prompt"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (isIos) {
    return (
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        role="region"
        aria-label="Add to Home Screen"
      >
        <div className="pointer-events-auto flex max-w-sm items-start gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs text-slate-600 shadow-md backdrop-blur-sm">
          <span className="leading-snug">
            On iPhone/iPad: tap <strong className="font-semibold text-slate-800">Share</strong>, then{" "}
            <strong className="font-semibold text-slate-800">Add to Home Screen</strong>.
          </span>
          <button
            type="button"
            onClick={dismiss}
            className="shrink-0 rounded-md px-1.5 py-0.5 font-medium text-sky-700 hover:bg-sky-50"
          >
            OK
          </button>
        </div>
      </div>
    );
  }

  return null;
}

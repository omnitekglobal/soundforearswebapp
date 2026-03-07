import { CLINIC_TIMEZONE } from "./datetime";

/** Format date with time in clinic timezone (e.g. "3/7/25, 10:30 AM") */
export function formatDateTime(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString(undefined, {
    timeZone: CLINIC_TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
    hour12: true,
  });
}

/** Date only in clinic timezone (e.g. "3/7/25") */
export function formatDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleDateString(undefined, {
    timeZone: CLINIC_TIMEZONE,
    dateStyle: "short",
  });
}

/**
 * Clinic timezone for storing and displaying date/time correctly.
 * Set CLINIC_TIMEZONE (e.g. "Asia/Kolkata") and optionally
 * CLINIC_TIMEZONE_OFFSET (e.g. "+05:30") in .env for your region.
 */
const CLINIC_TIMEZONE = process.env.CLINIC_TIMEZONE || "Asia/Kolkata";
const CLINIC_OFFSET = process.env.CLINIC_TIMEZONE_OFFSET || "+05:30";

/**
 * Parse a date string (YYYY-MM-DD) as midnight in clinic timezone.
 * Returns a Date (UTC) so the DB stores the correct moment and display shows correct date/time.
 */
export function parseDateInClinicTz(dateStr) {
  const s = typeof dateStr === "string" ? dateStr.trim() : "";
  if (!s) return null;
  const iso = s.includes("T") ? s : `${s}T00:00:00${CLINIC_OFFSET}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Parse datetime string (YYYY-MM-DD or YYYY-MM-DDTHH:mm) in clinic timezone.
 * If only date is given, uses midnight in clinic TZ.
 */
export function parseDateTimeInClinicTz(value) {
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return null;
  const hasTime = s.includes("T");
  const iso = hasTime ? `${s}${s.includes("+") || s.endsWith("Z") ? "" : CLINIC_OFFSET}` : `${s}T00:00:00${CLINIC_OFFSET}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Today at midnight in clinic timezone (for "today" date fields). */
export function getTodayInClinicTz() {
  const now = new Date();
  const ymd = now.toLocaleDateString("en-CA", { timeZone: CLINIC_TIMEZONE });
  return parseDateInClinicTz(ymd) ?? now;
}

/** Current date and time in clinic timezone (for attendance date when time matters). */
export function getNowInClinicTz() {
  return new Date();
}

/**
 * Format a Date for use in <input type="datetime-local"> (YYYY-MM-DDTHH:mm) in clinic timezone.
 */
export function toDateTimeLocalValue(d) {
  if (!d) return "";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  const datePart = x.toLocaleDateString("en-CA", { timeZone: CLINIC_TIMEZONE });
  const timePart = x.toLocaleTimeString("en-GB", { timeZone: CLINIC_TIMEZONE, hour12: false }).slice(0, 5);
  return `${datePart}T${timePart}`;
}

/** Parse time "HH:mm" as today in clinic TZ (for attendance check-in/out). */
export function parseTimeTodayInClinicTz(timeStr) {
  const s = typeof timeStr === "string" ? timeStr.trim() : "";
  if (!s) return null;
  const match = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const ymd = new Date().toLocaleDateString("en-CA", { timeZone: CLINIC_TIMEZONE });
  const iso = `${ymd}T${String(parseInt(match[1], 10)).padStart(2, "0")}:${match[2]}:00${CLINIC_OFFSET}`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export { CLINIC_TIMEZONE };

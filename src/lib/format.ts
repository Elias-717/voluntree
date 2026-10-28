// Dates and times as people at AIU read them: Malaysia time, short and friendly.

const TZ = "Asia/Kuala_Lumpur";

/** "Tue 3 Nov" */
export function formatDay(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, weekday: "short", day: "numeric", month: "short" })
    .format(new Date(iso))
    .replace(",", "");
}

/** "09:00" */
export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .format(new Date(iso));
}

/** "Tue 3 Nov · 09:00" */
export function formatDayTime(iso: string): string {
  return `${formatDay(iso)} · ${formatTime(iso)}`;
}

/** "3 November 2026", for certificates and records. */
export function formatLongDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "long", year: "numeric" })
    .format(new Date(iso));
}

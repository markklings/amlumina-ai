const dueFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatDateTime = (iso: string) => dueFmt.format(new Date(iso));
export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const isPast = (iso: string | null) =>
  !!iso && new Date(iso).getTime() < Date.now();

export function relativeTime(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  const abs = Math.abs(diff);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
  ];
  for (const [unit, ms] of units)
    if (abs >= ms) return rtf.format(Math.round(diff / ms), unit);
  return "just now";
}

export const todayUtc = () => new Date().toISOString().slice(0, 10);

export function untilUtcMidnight() {
  const now = new Date();
  const next = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  const mins = Math.max(0, Math.round((next - now.getTime()) / 60_000));
  return {
    text: `${Math.floor(mins / 60)}h ${mins % 60}m`,
    local: new Date(next).toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    }),
  };
}

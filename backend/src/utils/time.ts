const parts = (ms: number, timeZone: string) => {
  const p = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(ms));
  const g = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return {
    y: g("year"),
    mo: g("month"),
    d: g("day"),
    h: g("hour"),
    mi: g("minute"),
    s: g("second"),
  };
};

const offsetMs = (utcMs: number, tz: string) => {
  const t = parts(utcMs, tz);
  return Date.UTC(t.y, t.mo - 1, t.d, t.h, t.mi, t.s) - utcMs;
};

/** "2026-10-27T19:00" in a time zone → UTC ISO string. Returns null if the input is malformed. */
export function zonedToUtcIso(local: string, timeZone: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi] = m.slice(1).map(Number);
  const guess = Date.UTC(y, mo - 1, d, h, mi);
  const first = guess - offsetMs(guess, timeZone);
  return new Date(guess - offsetMs(first, timeZone)).toISOString();
}

/** UTC ISO → "2026-10-27 19:00" in a time zone. */
export function isoToZoned(iso: string, timeZone: string): string {
  const t = parts(new Date(iso).getTime(), timeZone);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${t.y}-${p(t.mo)}-${p(t.d)} ${p(t.h)}:${p(t.mi)}`;
}

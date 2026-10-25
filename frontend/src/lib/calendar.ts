import type { PlannerEvent, PlannerTask } from "../types/planner";
import { eventDayKey, toDayKey } from "./planner";

const parse = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return { y, m: m - 1 };
};

export const monthKeyOf = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export const shiftMonth = (key: string, delta: number) => {
  const { y, m } = parse(key);
  return monthKeyOf(new Date(y, m + delta, 1));
};

export const monthLabel = (key: string) => {
  const { y, m } = parse(key);
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(y, m, 1));
};

export const dayLabel = (key: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(new Date(`${key}T00:00:00`));

/** 6 weeks starting on the Sunday on or before the 1st. */
export function gridDays(key: string): Date[] {
  const { y, m } = parse(key);
  const first = new Date(y, m, 1);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(y, m, 1 - first.getDay() + i),
  );
}

export function gridRange(key: string) {
  const days = gridDays(key);
  const last = days[41];
  return {
    from: days[0],
    to: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
  };
}

/** Every local day an event touches. All-day events end on an exclusive date. */
function eventDays(e: PlannerEvent): string[] {
  if (!e.allDay) return [eventDayKey(e)];
  const end = e.end.slice(0, 10);
  const out: string[] = [];
  let d = new Date(`${e.start.slice(0, 10)}T00:00:00`);
  for (let i = 0; i < 31; i++) {
    const k = toDayKey(d);
    if (i > 0 && k >= end) break;
    out.push(k);
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
  }
  return out;
}

export interface DayEntry {
  events: PlannerEvent[];
  tasks: PlannerTask[];
}

export function indexByDay(
  events: PlannerEvent[],
  tasks: PlannerTask[],
): Map<string, DayEntry> {
  const map = new Map<string, DayEntry>();
  const entry = (k: string) => {
    let v = map.get(k);
    if (!v) map.set(k, (v = { events: [], tasks: [] }));
    return v;
  };

  for (const e of events) for (const k of eventDays(e)) entry(k).events.push(e);
  for (const t of tasks) if (t.due) entry(t.due).tasks.push(t);

  for (const v of map.values()) {
    v.events.sort((a, b) =>
      a.allDay !== b.allDay
        ? a.allDay
          ? -1
          : 1
        : new Date(a.start).getTime() - new Date(b.start).getTime(),
    );
  }
  return map;
}

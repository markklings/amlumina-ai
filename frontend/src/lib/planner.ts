import type { PlannerEvent, PlannerTask } from "../types/planner";

const pad = (n: number) => String(n).padStart(2, "0");
export const toDayKey = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayKey = () => toDayKey(new Date());
const keyToDate = (key: string) => new Date(`${key}T00:00:00`); // local midnight

const timeFmt = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
});
const dayFmt = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "short",
  day: "numeric",
});
const shortFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
});

const daysFromToday = (key: string) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return Math.round((keyToDate(key).getTime() - start.getTime()) / 86_400_000);
};

/** All-day events carry a plain date; timed events are converted to the viewer's local day. */
export const eventDayKey = (e: PlannerEvent) =>
  e.allDay ? e.start.slice(0, 10) : toDayKey(new Date(e.start));

export function dayHeading(key: string): string {
  const diff = daysFromToday(key);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return dayFmt.format(keyToDate(key));
}

export function eventTime(e: PlannerEvent): string {
  if (e.allDay) return "All day";
  return `${timeFmt.format(new Date(e.start))} – ${timeFmt.format(new Date(e.end))}`;
}

export const isEnded = (e: PlannerEvent) =>
  e.allDay
    ? e.start.slice(0, 10) < todayKey()
    : new Date(e.end).getTime() < Date.now();

export interface DayGroup {
  key: string;
  label: string;
  events: PlannerEvent[];
}

/** Days with events, plus today even when it is empty. A multi-day all-day event shows on its first day. */
export function groupEventsByDay(events: PlannerEvent[]): DayGroup[] {
  const map = new Map<string, PlannerEvent[]>();
  for (const e of events) {
    const key = eventDayKey(e);
    map.set(key, [...(map.get(key) ?? []), e]);
  }
  if (!map.has(todayKey())) map.set(todayKey(), []);

  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({
      key,
      label: dayHeading(key),
      events: [...list].sort((a, b) =>
        a.allDay !== b.allDay
          ? a.allDay
            ? -1
            : 1
          : new Date(a.start).getTime() - new Date(b.start).getTime(),
      ),
    }));
}

export function taskDue(
  task: PlannerTask,
): { label: string; overdue: boolean } | null {
  if (!task.due) return null;
  const diff = daysFromToday(task.due);
  if (diff < 0 && !task.completed)
    return {
      label: `Overdue · ${shortFmt.format(keyToDate(task.due))}`,
      overdue: true,
    };
  if (diff === 0) return { label: "Due today", overdue: false };
  if (diff === 1) return { label: "Due tomorrow", overdue: false };
  return {
    label: `Due ${shortFmt.format(keyToDate(task.due))}`,
    overdue: false,
  };
}

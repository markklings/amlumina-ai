export type EventColor =
  | "zinc"
  | "red"
  | "orange"
  | "amber"
  | "green"
  | "teal"
  | "blue"
  | "violet"
  | "pink";

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  start: string; // UTC ISO for timed events, YYYY-MM-DD for all-day
  end: string; // all-day: inclusive date
  allDay: boolean;
  color: EventColor;
  source: "user" | "lumi";
}

export type EventPayload = Omit<CalendarEvent, "id" | "source">;

export interface TaskItem {
  id: string;
  title: string;
  notes: string | null;
  due: string | null; // YYYY-MM-DD
  remindDays?: number | null;
  completed: boolean;
}

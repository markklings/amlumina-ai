import type {
  CalendarEvent,
  EventColor,
  EventPayload,
} from "../types/calendar";

const pad = (n: number) => String(n).padStart(2, "0");
const dateInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const dateTimeInput = (d: Date) =>
  `${dateInput(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export interface EventFormValues {
  title: string;
  description: string;
  allDay: boolean;
  start: string; // date or datetime-local input format
  end: string;
  color: EventColor;
}

export const blankForm = (dayKey: string): EventFormValues => ({
  title: "",
  description: "",
  allDay: false,
  start: `${dayKey}T09:00`,
  end: `${dayKey}T10:00`,
  color: "blue",
});

export const formFromEvent = (e: CalendarEvent): EventFormValues => ({
  title: e.title,
  description: e.description,
  allDay: e.allDay,
  start: e.allDay ? e.start : dateTimeInput(new Date(e.start)),
  end: e.allDay ? e.end : dateTimeInput(new Date(e.end)),
  color: e.color,
});

export const withAllDay = (
  v: EventFormValues,
  allDay: boolean,
): EventFormValues =>
  allDay
    ? { ...v, allDay, start: v.start.slice(0, 10), end: v.end.slice(0, 10) }
    : {
        ...v,
        allDay,
        start: `${v.start.slice(0, 10)}T09:00`,
        end: `${v.end.slice(0, 10)}T10:00`,
      };

export function validateForm(v: EventFormValues): {
  title?: string;
  end?: string;
} {
  const errors: { title?: string; end?: string } = {};
  if (!v.title.trim()) errors.title = "Enter a title";
  if (!v.start || !v.end) errors.end = "Choose a start and an end";
  else if (v.end < v.start) errors.end = "The end must not be before the start";
  return errors;
}

export const toPayload = (v: EventFormValues): EventPayload => ({
  title: v.title.trim(),
  description: v.description.trim(),
  allDay: v.allDay,
  start: v.allDay ? v.start : new Date(v.start).toISOString(),
  end: v.allDay ? v.end : new Date(v.end).toISOString(),
  color: v.color,
});

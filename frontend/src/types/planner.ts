export interface PlannerEvent {
  id: string;
  title: string;
  start: string; // ISO date-time, or YYYY-MM-DD when allDay
  end: string;
  allDay: boolean;
  location: string | null;
  link: string;
  createdByLumi: boolean;
}

export interface PlannerTask {
  id: string;
  title: string;
  notes: string | null;
  due: string | null; // YYYY-MM-DD (Google Tasks stores a date only)
  completed: boolean;
}

export interface PlannerData {
  calendar: { connected: boolean; events: PlannerEvent[] };
  tasks: { connected: boolean; items: PlannerTask[] };
}

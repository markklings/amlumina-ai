import type { IconType } from "react-icons";
import {
  LuCalendar,
  LuFileText,
  LuFolder,
  LuGlobe,
  LuGraduationCap,
  LuListTodo,
  LuTable,
  LuWrench,
} from "react-icons/lu";

const APPS: { prefix: string; label: string; icon: IconType }[] = [
  {
    prefix: "google_classroom",
    label: "Google Classroom",
    icon: LuGraduationCap,
  },
  { prefix: "google_drive", label: "Google Drive", icon: LuFolder },
  { prefix: "google_docs", label: "Google Docs", icon: LuFileText },
  { prefix: "google_sheets", label: "Google Sheets", icon: LuTable },
  { prefix: "google_calendar", label: "Google Calendar", icon: LuCalendar },
  { prefix: "google_tasks", label: "Google Tasks", icon: LuListTodo },
  { prefix: "web", label: "web", icon: LuGlobe },
];

export const getToolApp = (name: string) =>
  APPS.find((a) => name.startsWith(a.prefix)) ?? {
    label: "Tool",
    icon: LuWrench,
  };

export function getToolLabel(name: string) {
  const app = APPS.find((a) => name.startsWith(a.prefix));
  const raw = app ? name.slice(app.prefix.length).replace(/^_/, "") : name;
  const words = raw.replace(/_/g, " ").trim();
  return {
    app: app?.label ?? "Tool",
    action: words ? words.charAt(0).toUpperCase() + words.slice(1) : "Run",
  };
}

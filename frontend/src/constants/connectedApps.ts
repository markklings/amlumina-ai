import type { IconType } from "react-icons";
import {
  LuCalendar,
  LuFileText,
  LuFolder,
  LuGraduationCap,
  LuListTodo,
  LuTable,
} from "react-icons/lu";

export interface ConnectableApp {
  id: number;
  name: string;
  short: string;
  description: string;
  icon: IconType;
}

export const connectableApps: ConnectableApp[] = [
  {
    id: 1,
    name: "Google Classroom",
    short: "Classroom",
    description: "Check your courses, coursework and announcements",
    icon: LuGraduationCap,
  },
  {
    id: 2,
    name: "Google Drive",
    short: "Drive",
    description: "Manage and store your study files",
    icon: LuFolder,
  },
  {
    id: 3,
    name: "Google Docs",
    short: "Docs",
    description: "Create and manage reviewers and notes",
    icon: LuFileText,
  },
  {
    id: 4,
    name: "Google Sheets",
    short: "Sheets",
    description: "Create and manage study checklists",
    icon: LuTable,
  },
  {
    id: 5,
    name: "Google Calendar",
    short: "Calendar",
    description: "Manage study plans and schedules",
    icon: LuCalendar,
  },
  {
    id: 6,
    name: "Google Tasks",
    short: "Tasks",
    description: "Manage and store your study tasks",
    icon: LuListTodo,
  },
];

export const getConnectableApp = (id: number) =>
  connectableApps.find((a) => a.id === id);

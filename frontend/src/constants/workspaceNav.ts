import type { IconType } from "react-icons";
import {
  LuCalendarDays,
  LuGauge,
  LuGraduationCap,
  LuLibrary,
  LuUser,
  LuCalendar,
} from "react-icons/lu";
import { paths } from "../router/paths";

export interface WorkspaceNavItem {
  id: "planner" | "classroom" | "library" | "usage" | "profile" | "calendar";
  label: string;
  path: string;
  icon: IconType;
}

export const workspaceNav: WorkspaceNavItem[] = [
  {
    id: "planner",
    label: "Planner",
    path: paths.planner,
    icon: LuCalendarDays,
  },
  {
    id: "classroom",
    label: "Classroom",
    path: paths.classroom,
    icon: LuGraduationCap,
  },
  { id: "library", label: "Library", path: paths.library, icon: LuLibrary },
  { id: "usage", label: "Usage", path: paths.usage, icon: LuGauge },
  { id: "calendar", label: "Calendar", path: paths.calendar, icon: LuCalendar },
  { id: "profile", label: "Profile", path: paths.profile, icon: LuUser },
];

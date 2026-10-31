import type { IconType } from "react-icons";
import {
  LuCalendarDays,
  LuClock,
  LuGauge,
  LuGraduationCap,
  LuLayers,
  LuLibrary,
  LuListTodo,
  LuShield,
  LuTrendingUp,
  LuUser,
} from "react-icons/lu";
import { paths } from "../router/paths";

export interface WorkspaceNavItem {
  id:
    | "calendar"
    | "tasks"
    | "practice"
    | "focus"
    | "progress"
    | "classroom"
    | "library"
    | "usage"
    | "profile"
    | "admin";
  path: string;
  icon: IconType;
  adminOnly?: boolean;
}

export const workspaceNav: WorkspaceNavItem[] = [
  { id: "calendar", path: paths.calendar, icon: LuCalendarDays },
  { id: "tasks", path: paths.tasks, icon: LuListTodo },
  { id: "practice", path: paths.practice, icon: LuLayers },
  { id: "focus", path: paths.focus, icon: LuClock },
  { id: "progress", path: paths.progress, icon: LuTrendingUp },
  { id: "classroom", path: paths.classroom, icon: LuGraduationCap },
  { id: "library", path: paths.library, icon: LuLibrary },
  { id: "usage", path: paths.usage, icon: LuGauge },
  { id: "profile", path: paths.profile, icon: LuUser },
  { id: "admin", path: paths.admin, icon: LuShield, adminOnly: true },
];

// import type { IconType } from "react-icons";
// import {
//   LuCalendarDays,
//   LuGauge,
//   LuGraduationCap,
//   LuLibrary,
//   LuListTodo,
//   LuUser,
//   LuLayers,
//   LuClock,
// } from "react-icons/lu";
// import { paths } from "../router/paths";
//
// export interface WorkspaceNavItem {
//   id:
//     | "calendar"
//     | "tasks"
//     | "classroom"
//     | "library"
//     | "usage"
//     | "profile"
//     | "practice"
//     | "focus";
//   label: string;
//   path: string;
//   icon: IconType;
// }
//
// export const workspaceNav: WorkspaceNavItem[] = [
//   { id: "practice", label: "Practice", path: paths.practice, icon: LuLayers },
//   { id: "focus", label: "Focus", path: paths.focus, icon: LuClock },
//   {
//     id: "calendar",
//     label: "Calendar",
//     path: paths.calendar,
//     icon: LuCalendarDays,
//   },
//   { id: "tasks", label: "Tasks", path: paths.tasks, icon: LuListTodo },
//   {
//     id: "classroom",
//     label: "Classroom",
//     path: paths.classroom,
//     icon: LuGraduationCap,
//   },
//   { id: "library", label: "Library", path: paths.library, icon: LuLibrary },
//   { id: "usage", label: "Usage", path: paths.usage, icon: LuGauge },
//   { id: "profile", label: "Profile", path: paths.profile, icon: LuUser },
// ];

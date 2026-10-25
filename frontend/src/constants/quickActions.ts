import {
  LuCalendarPlus,
  LuFileText,
  LuGraduationCap,
  LuListChecks,
  LuListTodo,
} from "react-icons/lu";
import type { QuickAction } from "../types/ui";

export const quickActions: QuickAction[] = [
  {
    id: "schedule",
    label: "Make Schedule",
    icon: LuCalendarPlus,
    prompt:
      "Make a weekly study schedule for me based on my calendar and upcoming deadlines.",
  },
  {
    id: "classroom",
    label: "Check Classroom",
    icon: LuGraduationCap,
    prompt: "Check my Google Classroom",
  },
  {
    id: "reviewer",
    label: "Create Reviewer",
    icon: LuFileText,
    prompt: "Create a reviewer document about ",
  },
  {
    id: "checklist",
    label: "Study Checklist",
    icon: LuListChecks,
    prompt: "Make a study checklist in Google Sheets for ",
  },
  {
    id: "tasks",
    label: "Add Tasks",
    icon: LuListTodo,
    prompt: "Add these study tasks to Google Tasks: ",
  },
];

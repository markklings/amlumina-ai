import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuCalendarDays,
  LuFileText,
  LuGlobe,
  LuGraduationCap,
  LuListTodo,
} from "react-icons/lu";

export const navLinks = [
  { id: "about", label: "About" },
  { id: "features", label: "Core functions" },
  { id: "developer", label: "Developer" },
] as const;

export const aboutPoints = [
  {
    title: "Learns your way",
    text: "Pick a teaching style such as step-by-step, Socratic or fast learning, and change it any time.",
  },
  {
    title: "Works with your school apps",
    text: "Connect Google Classroom, Calendar, Tasks and more, including your .edu account.",
  },
  {
    title: "Your key, your data",
    text: "Runs on your own Gemini API key. Keys and tokens are stored encrypted.",
  },
];

export interface Feature {
  id: string;
  title: string;
  short: string;
  detail: string;
  example: string;
  icon: IconType;
}

export const features: Feature[] = [
  {
    id: "tutor",
    title: "AI tutor",
    short: "Explanations in the style you choose.",
    detail:
      "Choose from six learning methods. The tutor adapts its answers, asks questions or gives practice, depending on how you learn best.",
    example: "Explain recursion step by step",
    icon: LuBookOpen,
  },
  {
    id: "classroom",
    title: "Google Classroom",
    short: "Courses, deadlines and announcements.",
    detail:
      "See what is due, read announcements and find course materials without leaving the chat. Connect your school account to enable it.",
    example: "Check my Google Classroom",
    icon: LuGraduationCap,
  },
  {
    id: "calendar",
    title: "Study planner",
    short: "Schedules that appear on your calendar.",
    detail:
      "Ask for a study plan and the sessions are added to Google Calendar. A calendar page shows your events and the plans Lumi made.",
    example: "Make a weekly study schedule",
    icon: LuCalendarDays,
  },
  {
    id: "tasks",
    title: "Tasks",
    short: "Turn plans into a checklist.",
    detail:
      "Create study tasks in Google Tasks and check them off from the planner page.",
    example: "Add a task to review chapter 3",
    icon: LuListTodo,
  },
  {
    id: "docs",
    title: "Reviewers and files",
    short: "Documents, sheets and folders.",
    detail:
      "Generate reviewers in Google Docs, checklists in Google Sheets and folders in Drive. Everything created is kept in your Library.",
    example: "Create a reviewer about photosynthesis",
    icon: LuFileText,
  },
  {
    id: "web",
    title: "Web search",
    short: "Current facts with sources.",
    detail:
      "When a question needs up-to-date information, the tutor can search the web and read a page, then cite the links.",
    example: "Search the web for the latest on Artemis",
    icon: LuGlobe,
  },
];

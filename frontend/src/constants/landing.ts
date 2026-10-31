import type { IconType } from "react-icons";
import {
  LuBookOpen,
  LuCalendarDays,
  LuFileText,
  LuGlobe,
  LuGraduationCap,
  LuLayers,
  LuListTodo,
  LuTarget,
} from "react-icons/lu";

export const navLinks = [
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "how", label: "How it works" },
  { id: "developer", label: "Developer" },
  { id: "faq", label: "FAQ" },
] as const;

export const aboutPoints = [
  {
    title: "Learns your way",
    text: "Pick a teaching style such as step-by-step, Socratic or fast learning, and change it any time.",
  },
  {
    title: "Connected to school",
    text: "Connect Google Classroom, including your .edu account, and ask about courses and deadlines.",
  },
  {
    title: "Your key, your data",
    text: "Runs on your own Gemini API key. Keys and tokens are stored encrypted.",
  },
];

export interface Feature {
  id: string;
  title: string;
  text: string;
  example: string;
  icon: IconType;
}

// The carousel loops through these in order.
// Remove any card for a feature you have not enabled (for example Practice).
export const features: Feature[] = [
  {
    id: "study",
    title: "Study",
    text: "An AI tutor that explains in the style you choose, from step-by-step to deep dive.",
    example: "Explain recursion step by step",
    icon: LuBookOpen,
  },
  {
    id: "plan",
    title: "Plan",
    text: "Turn deadlines into a study schedule, added straight to your built-in calendar.",
    example: "Make a weekly study schedule",
    icon: LuCalendarDays,
  },
  {
    id: "follow",
    title: "Follow",
    text: "Track focus sessions, streaks and daily usage so you can see your progress.",
    example: "Open Focus and start a session",
    icon: LuTarget,
  },
  {
    id: "classroom",
    title: "Google Classroom",
    text: "Check courses, coursework, announcements and materials without leaving the chat.",
    example: "Check my Google Classroom",
    icon: LuGraduationCap,
  },
  {
    id: "tasks",
    title: "Tasks and events",
    text: "Create tasks and calendar events by asking, with colors you choose, and edit them any time.",
    example: "Add a task to review chapter 3",
    icon: LuListTodo,
  },
  {
    id: "docs",
    title: "Reviewers and export",
    text: "Generate a reviewer, edit it in the built-in editor, and export it as Markdown, HTML, Word or PDF.",
    example: "Create a reviewer about photosynthesis",
    icon: LuFileText,
  },
  {
    id: "practice",
    title: "Flashcards and quizzes",
    text: "Make flashcards with spaced repetition and quizzes that are graded for you.",
    example: "Make flashcards about the Krebs cycle",
    icon: LuLayers,
  },
  {
    id: "web",
    title: "Web search",
    text: "When a question needs current facts, the tutor searches the web and cites the sources.",
    example: "Search the web for the latest on Artemis",
    icon: LuGlobe,
  },
];

export const steps = [
  {
    title: "Create your account",
    text: "Sign up with your email or Google, and add your own Gemini API key.",
  },
  {
    title: "Choose how you learn",
    text: "Pick a learning method. Lumi teaches in that style, and you can change it any time.",
  },
  {
    title: "Connect Classroom",
    text: "Optional. Link your school Google account so Lumi can check your courses and deadlines.",
  },
  {
    title: "Ask, plan and review",
    text: "Chat to learn, build a schedule, make tasks and reviewers, and practice with flashcards.",
  },
];

// Edit these freely. Answers are plain text.
export const faqs = [
  {
    q: "What is Amlumina AI?",
    a: "A study companion that teaches the way you learn. It explains topics, plans your study time, and works with your Google Classroom.",
  },
  {
    q: "Do I need my own Gemini API key?",
    a: "Yes. Amlumina AI runs on your own Gemini key, so your usage stays yours. The key is stored encrypted and is never shown again.",
  },
  {
    q: "Is Google Classroom required?",
    a: "No. It is optional. When connected, Lumi can only read your courses, coursework, announcements and materials. It cannot change anything in Classroom.",
  },
  {
    q: "Can I export what Lumi writes?",
    a: "Yes. Documents open in a built-in editor where you can edit them and export as Markdown, HTML, a Word-compatible file, or PDF through your browser's print dialog.",
  },
  {
    q: "Where are my events, tasks and documents stored?",
    a: "In Amlumina AI's own database, tied to your account. You can edit or delete them any time, and deleting your account removes them.",
  },
  {
    q: "Can I use a school account?",
    a: "Yes, but a school administrator may restrict third-party apps. If connecting fails, ask your administrator to allow it.",
  },
  {
    q: "Can I change my learning method later?",
    a: "Yes. Change it from the menu at the top of the chat. It applies to new chats, and existing chats keep the method they started with.",
  },
];

// import type { IconType } from "react-icons";
// import {
//   LuBookOpen,
//   LuCalendarDays,
//   LuFileText,
//   LuGlobe,
//   LuGraduationCap,
//   LuListTodo,
// } from "react-icons/lu";
//
// export const navLinks = [
//   { id: "about", label: "About" },
//   { id: "features", label: "Core functions" },
//   { id: "developer", label: "Developer" },
// ] as const;
//
// export const aboutPoints = [
//   {
//     title: "Learns your way",
//     text: "Pick a teaching style such as step-by-step, Socratic or fast learning, and change it any time.",
//   },
//   {
//     title: "Works with your school apps",
//     text: "Connect Google Classroom, Calendar, Tasks and more, including your .edu account.",
//   },
//   {
//     title: "Your key, your data",
//     text: "Runs on your own Gemini API key. Keys and tokens are stored encrypted.",
//   },
// ];
//
// export interface Feature {
//   id: string;
//   title: string;
//   short: string;
//   detail: string;
//   example: string;
//   icon: IconType;
// }
//
// export const features: Feature[] = [
//   {
//     id: "tutor",
//     title: "AI tutor",
//     short: "Explanations in the style you choose.",
//     detail:
//       "Choose from six learning methods. The tutor adapts its answers, asks questions or gives practice, depending on how you learn best.",
//     example: "Explain recursion step by step",
//     icon: LuBookOpen,
//   },
//   {
//     id: "classroom",
//     title: "Google Classroom",
//     short: "Courses, deadlines and announcements.",
//     detail:
//       "See what is due, read announcements and find course materials without leaving the chat. Connect your school account to enable it.",
//     example: "Check my Google Classroom",
//     icon: LuGraduationCap,
//   },
//   {
//     id: "calendar",
//     title: "Study planner",
//     short: "Schedules that appear on your calendar.",
//     detail:
//       "Ask for a study plan and the sessions are added to Google Calendar. A calendar page shows your events and the plans Lumi made.",
//     example: "Make a weekly study schedule",
//     icon: LuCalendarDays,
//   },
//   {
//     id: "tasks",
//     title: "Tasks",
//     short: "Turn plans into a checklist.",
//     detail:
//       "Create study tasks in Google Tasks and check them off from the planner page.",
//     example: "Add a task to review chapter 3",
//     icon: LuListTodo,
//   },
//   {
//     id: "docs",
//     title: "Reviewers and files",
//     short: "Documents, sheets and folders.",
//     detail:
//       "Generate reviewers in Google Docs, checklists in Google Sheets and folders in Drive. Everything created is kept in your Library.",
//     example: "Create a reviewer about photosynthesis",
//     icon: LuFileText,
//   },
//   {
//     id: "web",
//     title: "Web search",
//     short: "Current facts with sources.",
//     detail:
//       "When a question needs up-to-date information, the tutor can search the web and read a page, then cite the links.",
//     example: "Search the web for the latest on Artemis",
//     icon: LuGlobe,
//   },
// ];

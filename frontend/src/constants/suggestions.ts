import {
  LuCalendarPlus,
  LuFileText,
  LuGraduationCap,
  LuLightbulb,
} from "react-icons/lu";
import type { Suggestion } from "../types/ui";

export const suggestions: Suggestion[] = [
  {
    id: "s1",
    text: "Explain [paste content here]",
    icon: LuLightbulb,
  },
  {
    id: "s2",
    text: "Check my Google Classroom for what is due this week",
    icon: LuGraduationCap,
  },
  {
    id: "s3",
    text: "Make a study schedule for this week",
    icon: LuCalendarPlus,
  },
  {
    id: "s4",
    text: "Create a document [paste type here (e.g. Reviewer)] about [paste content here]",
    icon: LuFileText,
  },
];

import {
  LuLayers,
  LuListOrdered,
  LuMessageCircle,
  LuPuzzle,
  LuTarget,
  LuZap,
} from "react-icons/lu";
import type { LearningMethod } from "../types/method";

export const learningMethods: LearningMethod[] = [
  {
    id: 1,
    name: "Step-by-Step",
    description: "Small, ordered steps with a check before moving on.",
    recommended: true,
    icon: LuListOrdered,
  },
  {
    id: 2,
    name: "Fast Learning",
    description: "Short explanations, key takeaways and memory tricks.",
    recommended: false,
    icon: LuZap,
  },
  {
    id: 3,
    name: "Socratic",
    description: "Guides you to the answer with questions.",
    recommended: false,
    icon: LuMessageCircle,
  },
  {
    id: 4,
    name: "Practice-First",
    description: "Brief explanation, then questions and instant feedback.",
    recommended: false,
    icon: LuTarget,
  },
  {
    id: 5,
    name: "Analogies & Visuals",
    description: "Real-life analogies, tables and simple diagrams.",
    recommended: false,
    icon: LuPuzzle,
  },
  {
    id: 6,
    name: "Deep Dive",
    description: "First-principles detail, edge cases and misconceptions.",
    recommended: false,
    icon: LuLayers,
  },
];

export const DEFAULT_METHOD_ID =
  learningMethods.find((m) => m.recommended)?.id ?? learningMethods[0].id;

import type { IconType } from "react-icons";

export interface QuickAction {
  id: string;
  label: string;
  prompt: string;
  icon: IconType;
}

export interface Suggestion {
  id: string;
  text: string;
  icon: IconType;
}

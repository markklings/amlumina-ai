import type { IconType } from "react-icons";

export interface LearningMethod {
  id: number;
  name: string;
  description: string;
  recommended: boolean;
  icon: IconType;
}

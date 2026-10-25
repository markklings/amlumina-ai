import type { IconType } from "react-icons";
import { LuFileText, LuLifeBuoy, LuShield } from "react-icons/lu";
import { paths } from "../router/paths";

export const settingsLinks: {
  id: string;
  label: string;
  icon: IconType;
  to: string | null;
}[] = [
  { id: "help", label: "Help & feedback", icon: LuLifeBuoy, to: null },
  { id: "privacy", label: "Privacy & data", icon: LuShield, to: paths.privacy },
  { id: "terms", label: "Terms of use", icon: LuFileText, to: paths.terms },
];

import { LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "../../hooks/useTheme";
import IconButton from "../ui/IconButton";

export default function ThemeToggle() {
  const { resolved, toggle } = useTheme();
  const dark = resolved === "dark";

  return (
    <IconButton
      label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      {dark ? <LuSun className="size-5" /> : <LuMoon className="size-5" />}
    </IconButton>
  );
}

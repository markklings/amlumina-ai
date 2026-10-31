import { LuMonitor, LuMoon, LuSun } from "react-icons/lu";
import { useTheme } from "../../hooks/useTheme";
import { cn } from "../../lib/cn";
import type { ThemePreference } from "../../providers/themeContext";

const OPTIONS = [
  { value: "light", label: "Light", icon: LuSun },
  { value: "dark", label: "Dark", icon: LuMoon },
  { value: "system", label: "System", icon: LuMonitor },
] as const satisfies readonly {
  value: ThemePreference;
  label: string;
  icon: unknown;
}[];

export default function AppearanceSetting() {
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-900"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setPreference(value)}
            className={cn(
              "flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs font-medium transition-colors",
              active
                ? "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}

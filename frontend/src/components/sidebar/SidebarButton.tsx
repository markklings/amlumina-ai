import type { IconType } from "react-icons";
import { cn } from "../../lib/cn";

interface Props {
  icon: IconType;
  label: string;
  collapsed: boolean;
  onClick: () => void;
  variant?: "primary" | "ghost";
}

const variants = {
  primary:
    "bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300",
  ghost:
    "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
};

export default function SidebarButton({
  icon: Icon,
  label,
  collapsed,
  onClick,
  variant = "ghost",
}: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? label : undefined}
      aria-label={label}
      className={cn(
        "flex h-10 items-center gap-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        collapsed ? "w-10 justify-center" : "w-full px-3",
        variants[variant],
      )}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </button>
  );
}

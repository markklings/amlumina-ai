import type { ConnectableApp } from "../../constants/connectedApps";
import { cn } from "../../lib/cn";
import ToggleTrack from "../ui/ToggleTrack";

interface Props {
  app: ConnectableApp;
  on: boolean;
  index: number;
  onToggle: () => void;
}

export default function AppToggleRow({ app, on, index, onToggle }: Props) {
  const Icon = app.icon;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      style={{ animationDelay: `${index * 45}ms` }}
      className={cn(
        "flex min-h-[52px] w-full animate-fade-up items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        on
          ? "border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
          : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60",
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{app.name}</span>
        <span className="block text-xs text-zinc-500 sm:truncate">
          {app.description}
        </span>
      </span>
      <ToggleTrack on={on} />
    </button>
  );
}

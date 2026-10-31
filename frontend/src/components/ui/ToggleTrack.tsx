import { cn } from "../../lib/cn";

export default function ToggleTrack({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "relative inline-block h-6 w-10 shrink-0 rounded-full transition-colors duration-200",
        on ? "bg-zinc-900 dark:bg-zinc-100" : "bg-zinc-200 dark:bg-zinc-800",
      )}
    >
      <span
        className={cn(
          "absolute left-0.5 top-0.5 size-5 rounded-full transition-all duration-200",
          on
            ? "translate-x-4 bg-white dark:bg-zinc-900"
            : "translate-x-0 bg-white dark:bg-zinc-500",
        )}
      />
    </span>
  );
}

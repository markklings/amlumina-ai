import { cn } from "../../lib/cn";

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-900",
        className,
      )}
    />
  );
}

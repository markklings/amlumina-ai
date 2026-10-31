import { cn } from "../../lib/cn";

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm" };

interface Props {
  name: string;
  size?: keyof typeof sizes;
  className?: string;
}

export default function Avatar({ name, size = "sm", className }: Props) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900",
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}

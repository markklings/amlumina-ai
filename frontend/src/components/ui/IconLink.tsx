import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

interface Props {
  href: string;
  label: string;
  className?: string;
  children: ReactNode;
}

export default function IconLink({ href, label, className, children }: Props) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition-colors hover:bg-zinc-200/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/80 dark:focus-visible:outline-zinc-100",
        className,
      )}
    >
      {children}
    </a>
  );
}

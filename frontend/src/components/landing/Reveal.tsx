import type { ReactNode } from "react";
import { useReveal } from "../../hooks/useReveal";
import { cn } from "../../lib/cn";

interface Props {
  children: ReactNode;
  delay?: number; // ms
  className?: string;
}

export default function Reveal({ children, delay = 0, className }: Props) {
  const { ref, shown } = useReveal<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
      className={cn(
        "transition-[opacity,transform] duration-700 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

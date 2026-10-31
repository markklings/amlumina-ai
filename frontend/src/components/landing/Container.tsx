import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

/** 5% side margins on mobile and tablet, 15% on desktop and laptop. */
export default function Container({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("w-full px-[5%] lg:px-[15%]", className)}>
      {children}
    </div>
  );
}

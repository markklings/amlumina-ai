import { useEffect, useRef, type ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  focusOnMount?: boolean;
  footer: ReactNode;
  children: ReactNode;
}

export default function StepShell({
  title,
  description,
  focusOnMount = false,
  footer,
  children,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus({ preventScroll: true });
  }, [focusOnMount]);

  return (
    <div className="animate-fade-up">
      <h1
        ref={headingRef}
        tabIndex={-1}
        className="text-center text-2xl font-semibold tracking-tight outline-none"
      >
        {title}
      </h1>
      <p className="mt-1 text-center text-sm text-zinc-500">{description}</p>
      <div className="mt-5">{children}</div>
      <div className="mt-5 flex gap-3">{footer}</div>
    </div>
  );
}

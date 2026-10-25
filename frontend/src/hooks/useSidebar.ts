import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px)";

export function useSidebar() {
  const [isDesktop, setIsDesktop] = useState(() => matchMedia(QUERY).matches);
  const [open, setOpen] = useState(isDesktop);

  useEffect(() => {
    const mq = matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => {
      setIsDesktop(e.matches);
      setOpen(e.matches);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return {
    isDesktop,
    open,
    toggle: () => setOpen((o) => !o),
    close: () => setOpen(false),
  };
}

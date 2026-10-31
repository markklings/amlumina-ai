import type { ReactNode } from "react";

interface Props {
  sidebar: ReactNode;
  overlay?: ReactNode;
  children: ReactNode;
}

export default function AppLayout({ sidebar, overlay, children }: Props) {
  return (
    <div className="flex h-dvh overflow-hidden bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      {sidebar}
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
      {overlay}
    </div>
  );
}

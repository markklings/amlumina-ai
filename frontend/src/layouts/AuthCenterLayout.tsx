import type { ReactNode } from "react";
import AuthBrand from "../components/auth/AuthBrand";
import ThemeToggle from "../components/theme/ThemeToggle";

interface Props {
  action?: ReactNode;
  children: ReactNode;
}

export default function AuthCenterLayout({ action, children }: Props) {
  return (
    <div className="flex min-h-dvh flex-col bg-white roomy:h-dvh roomy:min-h-0 roomy:overflow-hidden dark:bg-black">
      <header className="flex h-14 shrink-0 items-center justify-between px-4 sm:px-6">
        <AuthBrand />
        <div className="flex items-center gap-1">
          {action}
          <ThemeToggle />
        </div>
      </header>
      <main className="flex min-h-0 flex-1 flex-col roomy:overflow-y-auto">
        <div className="m-auto w-full max-w-lg px-4 py-4 sm:px-6">
          {children}
        </div>
      </main>
    </div>
  );
}

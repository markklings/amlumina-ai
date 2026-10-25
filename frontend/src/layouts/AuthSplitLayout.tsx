import type { ReactNode } from "react";
import AuthBanner from "../components/auth/AuthBanner";
import AuthBrand from "../components/auth/AuthBrand";
import ThemeToggle from "../components/theme/ThemeToggle";

export default function AuthSplitLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh grid-cols-1 bg-white lg:grid-cols-[2fr_3fr] roomy:h-dvh roomy:grid-rows-[minmax(0,1fr)] roomy:overflow-hidden dark:bg-black">
      <section className="flex min-h-0 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between px-6">
          <AuthBrand />
          <ThemeToggle />
        </header>
        <main className="flex min-h-0 flex-1 flex-col roomy:overflow-y-auto">
          <div className="m-auto w-full max-w-sm px-6 py-6">{children}</div>
        </main>
      </section>

      <AuthBanner className="hidden lg:block" />
    </div>
  );
}

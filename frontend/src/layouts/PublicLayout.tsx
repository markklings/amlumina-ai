import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import AuthBrand from "../components/auth/AuthBrand";
import ThemeToggle from "../components/theme/ThemeToggle";
import { APP_NAME } from "../constants/app";
import { paths } from "../router/paths";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Link to={paths.home} aria-label="Home">
            <AuthBrand />
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500 dark:border-zinc-800">
        Shared with {APP_NAME}.{" "}
        <Link
          to={paths.signup}
          className="font-medium underline underline-offset-4"
        >
          Create your own study space
        </Link>
      </footer>
    </div>
  );
}

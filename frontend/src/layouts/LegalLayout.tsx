import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import AuthBrand from "../components/auth/AuthBrand";
import ThemeToggle from "../components/theme/ThemeToggle";
import { cn } from "../lib/cn";
import { paths } from "../router/paths";

const links = [
  { to: paths.terms, label: "Terms of Use" },
  { to: paths.privacy, label: "Privacy & Data" },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4">
          <Link to="/" aria-label="Home">
            <AuthBrand />
          </Link>
          <div className="flex items-center gap-1">
            <nav aria-label="Legal" className="flex items-center gap-1">
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-zinc-100 dark:bg-zinc-900"
                        : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                    )
                  }
                >
                  {l.label}
                </NavLink>
              ))}
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-10">{children}</main>
    </div>
  );
}

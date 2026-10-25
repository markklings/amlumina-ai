import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LuArrowLeft } from "react-icons/lu";
import ThemeToggle from "../components/theme/ThemeToggle";
import { workspaceNav } from "../constants/workspaceNav";
import { cn } from "../lib/cn";
import { paths } from "../router/paths";

export default function WorkspaceLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-white text-zinc-900 dark:bg-black dark:text-zinc-100">
      <header className="shrink-0 border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-2 px-4 sm:px-6">
          <Link
            to={paths.chat}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
          >
            <LuArrowLeft className="size-4" />
            Back to chat
          </Link>
          <ThemeToggle />
        </div>
        <nav
          aria-label="Workspace"
          className="mx-auto flex w-full max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {workspaceNav.map(({ id, label, path, icon: Icon }) => (
            <NavLink
              key={id}
              to={path}
              className={({ isActive }) =>
                cn(
                  "-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                  isActive
                    ? "border-zinc-900 dark:border-zinc-100"
                    : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
                )
              }
            >
              <Icon className="size-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main
        key={pathname}
        className="mx-auto w-full max-w-5xl flex-1 animate-fade-in px-4 py-8 sm:px-6"
      >
        <Outlet />
      </main>
    </div>
  );
}

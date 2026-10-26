import { Link } from "react-router-dom";
import { LuMenu, LuX } from "react-icons/lu";
import { navLinks } from "../../constants/landing";
import { useActiveSection } from "../../hooks/useActiveSection";
import { useAuth } from "../../hooks/useAuth";
import { useDisclosure } from "../../hooks/useDisclosure";
import { cn } from "../../lib/cn";
import { nextPathFor, paths } from "../../router/paths";
import AuthBrand from "../auth/AuthBrand";
import ThemeToggle from "../theme/ThemeToggle";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";

const ids = navLinks.map((l) => l.id);

export default function LandingNav() {
  const { user } = useAuth();
  const menu = useDisclosure();
  const active = useActiveSection(ids);

  const primary = user
    ? { to: nextPathFor(user), label: "Open app" }
    : { to: paths.signup, label: "Get started" };

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-black/90">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a href="#top" aria-label="Back to top">
          <AuthBrand />
        </a>

        <nav
          aria-label="Sections"
          className="hidden items-center gap-1 md:flex"
        >
          {navLinks.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              aria-current={active === l.id ? "true" : undefined}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active === l.id
                  ? "bg-zinc-100 dark:bg-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          {!user && (
            <Link
              to={paths.login}
              className="hidden rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 sm:inline-block dark:text-zinc-400 dark:hover:bg-zinc-900"
            >
              Log in
            </Link>
          )}
          <Link
            to={primary.to}
            className="hidden h-9 items-center rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 sm:inline-flex dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {primary.label}
          </Link>
          <IconButton
            label={menu.open ? "Close menu" : "Open menu"}
            onClick={menu.toggle}
            aria-expanded={menu.open}
            className="md:hidden"
          >
            {menu.open ? (
              <LuX className="size-5" />
            ) : (
              <LuMenu className="size-5" />
            )}
          </IconButton>
        </div>
      </div>

      {menu.open && (
        <nav
          aria-label="Mobile sections"
          className="animate-fade-in border-t border-zinc-200 px-4 py-3 md:hidden dark:border-zinc-800"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a
                  href={`#${l.id}`}
                  onClick={menu.hide}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex gap-2">
            {!user && (
              <Link to={paths.login} className="flex-1">
                <Button className="w-full">Log in</Button>
              </Link>
            )}
            <Link to={primary.to} className="flex-1">
              <Button variant="primary" className="w-full">
                {primary.label}
              </Button>
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}

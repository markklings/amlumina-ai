import { Link } from "react-router-dom";
import { APP_NAME, DEVELOPER, SUPPORT_EMAIL } from "../../constants/app";
import { navLinks } from "../../constants/landing";
import { paths } from "../../router/paths";
import AuthBrand from "../auth/AuthBrand";

const linkClass =
  "text-sm text-zinc-600 underline-offset-4 hover:underline dark:text-zinc-400";

export default function LandingFooter() {
  return (
    <footer className="border-t border-zinc-200 px-4 py-12 sm:px-6 dark:border-zinc-800">
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-1">
          <AuthBrand />
          <p className="mt-3 max-w-xs text-sm leading-6 text-zinc-500">
            A study companion that teaches the way you learn.
          </p>
        </div>

        <nav aria-label="Product">
          <h2 className="text-xs font-medium text-zinc-500">Product</h2>
          <ul className="mt-3 space-y-2">
            {navLinks.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`} className={linkClass}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Account">
          <h2 className="text-xs font-medium text-zinc-500">Account</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to={paths.login} className={linkClass}>
                Log in
              </Link>
            </li>
            <li>
              <Link to={paths.signup} className={linkClass}>
                Create an account
              </Link>
            </li>
          </ul>
        </nav>

        <nav aria-label="Legal and contact">
          <h2 className="text-xs font-medium text-zinc-500">
            Legal and support
          </h2>
          <ul className="mt-3 space-y-2">
            <li>
              <Link to={paths.terms} className={linkClass}>
                Terms of Use
              </Link>
            </li>
            <li>
              <Link to={paths.privacy} className={linkClass}>
                Privacy &amp; Data
              </Link>
            </li>
            {SUPPORT_EMAIL && (
              <li>
                <a href={`mailto:${SUPPORT_EMAIL}`} className={linkClass}>
                  {SUPPORT_EMAIL}
                </a>
              </li>
            )}
          </ul>
        </nav>
      </div>

      <p className="mx-auto mt-10 max-w-6xl border-t border-zinc-200 pt-6 text-xs text-zinc-500 dark:border-zinc-800">
        © {new Date().getFullYear()} {APP_NAME}. Built by {DEVELOPER.team}.
      </p>
    </footer>
  );
}

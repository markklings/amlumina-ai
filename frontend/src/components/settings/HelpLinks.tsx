import { Link } from "react-router-dom";
import { LuChevronRight, LuExternalLink } from "react-icons/lu";
import { APP_NAME, APP_VERSION } from "../../constants/app";
import { settingsLinks } from "../../constants/settingsLinks";

const rowClass =
  "flex h-10 w-full items-center gap-3 rounded-lg px-2 text-sm transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-900";

export default function HelpLinks() {
  return (
    <>
      <ul className="-mx-2">
        {settingsLinks.map(({ id, label, icon: Icon, to }) => (
          <li key={id}>
            {to ? (
              <Link
                to={to}
                target="_blank"
                rel="noreferrer"
                className={rowClass}
              >
                <Icon className="size-4 text-zinc-500" />
                <span className="flex-1 text-left">{label}</span>
                <LuExternalLink className="size-4 text-zinc-400" />
              </Link>
            ) : (
              <button type="button" className={rowClass}>
                <Icon className="size-4 text-zinc-500" />
                <span className="flex-1 text-left">{label}</span>
                <LuChevronRight className="size-4 text-zinc-400" />
              </button>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-zinc-500">
        {APP_NAME} v{APP_VERSION}
      </p>
    </>
  );
}

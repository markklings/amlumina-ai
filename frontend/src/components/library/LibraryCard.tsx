import { LuExternalLink } from "react-icons/lu";
import { libraryKinds } from "../../constants/libraryKinds";
import { relativeTime } from "../../lib/dates";
import type { LibraryItem } from "../../types/library";

export default function LibraryCard({ item }: { item: LibraryItem }) {
  const kind = libraryKinds[item.kind];
  const Icon = kind.icon;

  return (
    <a
      href={item.link}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
    >
      <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.title}</span>
        <span className="block truncate text-xs text-zinc-500">
          {kind.app} · {item.account} · {relativeTime(item.createdAt)}
        </span>
      </span>
      <LuExternalLink aria-hidden className="size-4 shrink-0 text-zinc-400" />
    </a>
  );
}

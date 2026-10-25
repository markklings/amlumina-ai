import { useMemo } from "react";
import { LuTrash2 } from "react-icons/lu";
import { groupChatsByDate } from "../../lib/groupChats";
import { cn } from "../../lib/cn";
import type { ChatSummary } from "../../types/chat";
import Skeleton from "../common/Skeleton";
import Button from "../ui/Button";
import IconButton from "../ui/IconButton";

interface Props {
  chats: ChatSummary[];
  activeId: string | null;
  loading: boolean;
  error: boolean;
  onSelect: (id: string) => void;
  onDelete: (chat: ChatSummary) => void;
  onRetry: () => void;
}

export default function ChatList({
  chats,
  activeId,
  loading,
  error,
  onSelect,
  onDelete,
  onRetry,
}: Props) {
  const groups = useMemo(() => groupChatsByDate(chats), [chats]);

  if (loading && !chats.length) {
    return (
      <div aria-busy="true" className="space-y-2 px-3 pb-3 pt-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-9 w-full" />
        ))}
      </div>
    );
  }

  if (error && !chats.length) {
    return (
      <div className="flex flex-col items-start gap-2 px-6 py-4">
        <p className="text-sm text-zinc-500">Could not load your chats.</p>
        <Button size="sm" onClick={onRetry}>
          Try again
        </Button>
      </div>
    );
  }

  if (!chats.length)
    return (
      <p className="px-6 py-4 text-sm text-zinc-500">
        No chats yet. Start one above.
      </p>
    );

  return (
    <nav aria-label="Chats" className="px-3 pb-3">
      {groups.map((group) => (
        <section key={group.label}>
          <h2 className="px-3 pb-1 pt-4 text-xs font-medium text-zinc-500">
            {group.label}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((chat) => (
              <li key={chat.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(chat.id)}
                  aria-current={chat.id === activeId ? "page" : undefined}
                  className={cn(
                    "w-full truncate rounded-lg py-2 pl-3 pr-11 text-left text-sm transition-colors",
                    chat.id === activeId
                      ? "bg-zinc-200/70 font-medium dark:bg-zinc-800"
                      : "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
                  )}
                >
                  {chat.title}
                </button>
                <IconButton
                  label={`Delete chat: ${chat.title}`}
                  onClick={() => onDelete(chat)}
                  className="absolute right-1 top-1/2 size-8 -translate-y-1/2 opacity-0 transition-opacity focus-visible:opacity-100 group-focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
                >
                  <LuTrash2 className="size-4" />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

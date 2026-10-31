import { useMemo, useState, type KeyboardEvent } from "react";
import { LuPencil, LuPin, LuPinOff, LuTrash2 } from "react-icons/lu";
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
  onRename: (id: string, title: string) => void;
  onPin: (id: string) => void;
  onRetry: () => void;
}

export default function ChatList({
  chats,
  activeId,
  loading,
  error,
  onSelect,
  onDelete,
  onRename,
  onPin,
  onRetry,
}: Props) {
  const groups = useMemo(() => groupChatsByDate(chats), [chats]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const finish = (save: boolean) => {
    if (save && editingId && draft.trim()) onRename(editingId, draft);
    setEditingId(null);
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") finish(true);
    if (e.key === "Escape") finish(false);
  };

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
                {editingId === chat.id ? (
                  <input
                    autoFocus
                    aria-label="Chat title"
                    maxLength={255}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={onKey}
                    onBlur={() => finish(true)}
                    className="h-9 w-full rounded-lg border border-zinc-400 bg-transparent px-3 text-sm outline-none dark:border-zinc-600"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onSelect(chat.id)}
                      aria-current={chat.id === activeId ? "page" : undefined}
                      className={cn(
                        "w-full truncate rounded-lg py-2 pl-3 pr-24 text-left text-sm transition-colors",
                        chat.id === activeId
                          ? "bg-zinc-200/70 font-medium dark:bg-zinc-800"
                          : "text-zinc-700 hover:bg-zinc-200/60 dark:text-zinc-300 dark:hover:bg-zinc-800/80",
                      )}
                    >
                      {chat.title}
                    </button>
                    <span className="absolute right-1 top-1/2 flex -translate-y-1/2 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100">
                      <IconButton
                        label={chat.pinned ? "Unpin chat" : "Pin chat"}
                        onClick={() => onPin(chat.id)}
                        className="size-7"
                      >
                        {chat.pinned ? (
                          <LuPinOff className="size-3.5" />
                        ) : (
                          <LuPin className="size-3.5" />
                        )}
                      </IconButton>
                      <IconButton
                        label={`Rename chat: ${chat.title}`}
                        onClick={() => {
                          setDraft(chat.title);
                          setEditingId(chat.id);
                        }}
                        className="size-7"
                      >
                        <LuPencil className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label={`Delete chat: ${chat.title}`}
                        onClick={() => onDelete(chat)}
                        className="size-7"
                      >
                        <LuTrash2 className="size-3.5" />
                      </IconButton>
                    </span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </nav>
  );
}

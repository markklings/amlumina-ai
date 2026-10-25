import { LuPanelLeft, LuSquarePen } from "react-icons/lu";
import { APP_NAME } from "../../constants/app";
import { cn } from "../../lib/cn";
import type { ChatSummary } from "../../types/chat";
import type { QuickAction } from "../../types/ui";
import type { User } from "../../types/user";
import IconButton from "../ui/IconButton";
import ChatList from "./ChatList";
import QuickActions from "./QuickActions";
import SidebarButton from "./SidebarButton";
import SidebarNav from "./SidebarNav";
import SidebarUser from "./SidebarUser";

interface Props {
  open: boolean;
  isDesktop: boolean;
  user: User;
  chats: ChatSummary[];
  activeChatId: string | null;
  onToggle: () => void;
  onClose: () => void;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onQuickAction: (action: QuickAction) => void;
  onNavigate: (path: string) => void;
  onOpenSettings: () => void;
  chatsLoading: boolean;
  chatsError: boolean;
  onRetryChats: () => void;
  onDeleteChat: (chat: ChatSummary) => void;
}

export default function Sidebar(p: Props) {
  const collapsed = p.isDesktop && !p.open;

  return (
    <>
      {!p.isDesktop && p.open && (
        <div
          aria-hidden
          onClick={p.onClose}
          className="fixed inset-0 z-30 bg-black/40"
        />
      )}

      <aside
        aria-label="Sidebar"
        className={cn(
          "z-40 flex h-dvh flex-col border-r border-zinc-200 bg-zinc-50 transition-[width,transform,visibility] duration-200 dark:border-zinc-800 dark:bg-zinc-950",
          p.isDesktop
            ? cn("relative shrink-0", p.open ? "w-72" : "w-16")
            : cn(
                "fixed inset-y-0 left-0 w-72 max-w-[85vw]",
                p.open ? "translate-x-0" : "invisible -translate-x-full",
              ),
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center gap-2",
            collapsed ? "justify-center" : "px-3",
          )}
        >
          <IconButton
            label={p.open ? "Collapse sidebar" : "Expand sidebar"}
            onClick={p.onToggle}
          >
            <LuPanelLeft className="size-5" />
          </IconButton>
          {!collapsed && (
            <span className="text-base font-semibold tracking-tight">
              {APP_NAME}
            </span>
          )}
        </div>

        <div
          className={cn(
            "flex shrink-0 flex-col",
            collapsed ? "items-center" : "px-3",
          )}
        >
          <SidebarButton
            icon={LuSquarePen}
            label="New chat"
            variant="primary"
            collapsed={collapsed}
            onClick={p.onNewChat}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <QuickActions collapsed={collapsed} onSelect={p.onQuickAction} />
          <SidebarNav collapsed={collapsed} onNavigate={p.onNavigate} />
          {!collapsed && (
            <ChatList
              chats={p.chats}
              activeId={p.activeChatId}
              loading={p.chatsLoading}
              error={p.chatsError}
              onSelect={p.onSelectChat}
              onDelete={p.onDeleteChat}
              onRetry={p.onRetryChats}
            />
          )}
        </div>

        <SidebarUser
          user={p.user}
          collapsed={collapsed}
          onOpenSettings={p.onOpenSettings}
        />
      </aside>
    </>
  );
}

import { LuSettings } from "react-icons/lu";
import { cn } from "../../lib/cn";
import type { User } from "../../types/user";
import Avatar from "../ui/Avatar";
import IconButton from "../ui/IconButton";

interface Props {
  user: User;
  collapsed: boolean;
  onOpenSettings: () => void;
}

export default function SidebarUser({
  user,
  collapsed,
  onOpenSettings,
}: Props) {
  return (
    <div
      className={cn(
        "flex shrink-0 border-t border-zinc-200 py-3 dark:border-zinc-800",
        collapsed ? "flex-col items-center gap-2" : "items-center gap-3 px-4",
      )}
      title={collapsed ? user.fullName : undefined}
    >
      <Avatar name={user.fullName} />
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.fullName}</p>
          <p className="truncate text-xs text-zinc-500">{user.email}</p>
        </div>
      )}
      <IconButton label="Settings" onClick={onOpenSettings}>
        <LuSettings className="size-5" />
      </IconButton>
    </div>
  );
}

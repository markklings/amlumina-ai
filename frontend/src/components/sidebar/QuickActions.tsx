import { quickActions } from "../../constants/quickActions";
import { cn } from "../../lib/cn";
import type { QuickAction } from "../../types/ui";
import SidebarButton from "./SidebarButton";

interface Props {
  collapsed: boolean;
  onSelect: (action: QuickAction) => void;
}

export default function QuickActions({ collapsed, onSelect }: Props) {
  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-1",
        collapsed ? "items-center" : "px-3",
      )}
    >
      {!collapsed && (
        <p className="px-3 pb-1 text-xs font-medium text-zinc-500">
          Quick actions
        </p>
      )}
      {quickActions.map((a) => (
        <SidebarButton
          key={a.id}
          icon={a.icon}
          label={a.label}
          collapsed={collapsed}
          onClick={() => onSelect(a)}
        />
      ))}
    </div>
  );
}

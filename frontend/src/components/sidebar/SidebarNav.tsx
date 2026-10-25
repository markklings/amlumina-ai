import { workspaceNav } from "../../constants/workspaceNav";
import { cn } from "../../lib/cn";
import SidebarButton from "./SidebarButton";

interface Props {
  collapsed: boolean;
  onNavigate: (path: string) => void;
}

const items = workspaceNav.filter((n) => n.id !== "profile");

export default function SidebarNav({ collapsed, onNavigate }: Props) {
  return (
    <div
      className={cn(
        "mt-3 flex flex-col gap-1",
        collapsed ? "items-center" : "px-3",
      )}
    >
      {!collapsed && (
        <p className="px-3 pb-1 text-xs font-medium text-zinc-500">Workspace</p>
      )}
      {items.map((n) => (
        <SidebarButton
          key={n.id}
          icon={n.icon}
          label={n.label}
          collapsed={collapsed}
          onClick={() => onNavigate(n.path)}
        />
      ))}
    </div>
  );
}

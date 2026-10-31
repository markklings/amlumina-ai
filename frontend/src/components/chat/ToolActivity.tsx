import { LuCheck, LuCircleAlert } from "react-icons/lu";
import { getToolLabel } from "../../constants/tools";
import type { ToolCall, ToolStatus } from "../../types/chat";

const STATUS_TEXT: Record<ToolStatus, string> = {
  running: "Running…",
  done: "Done",
  error: "Failed",
};

function Indicator({ status }: { status: ToolStatus }) {
  if (status === "running") {
    return (
      <span
        aria-hidden
        className="size-4 shrink-0 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100"
      />
    );
  }
  const Icon = status === "done" ? LuCheck : LuCircleAlert;
  return <Icon aria-hidden className="size-4 shrink-0" />;
}

export default function ToolActivity({ calls }: { calls: ToolCall[] }) {
  if (!calls.length) return null;

  return (
    <ul
      aria-live="polite"
      className="mb-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800"
    >
      {calls.map((call) => {
        const { app, action } = getToolLabel(call.name);
        return (
          <li
            key={call.id}
            className="flex items-center gap-3 px-3 py-2 text-sm"
          >
            <Indicator status={call.status} />
            <span className="min-w-0 flex-1 truncate">
              <span className="font-medium">{app}</span>
              <span className="text-zinc-500"> · {action}</span>
            </span>
            <span className="shrink-0 text-xs text-zinc-500">
              {STATUS_TEXT[call.status]}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

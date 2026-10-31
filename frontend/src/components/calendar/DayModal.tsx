import { LuCheck } from "react-icons/lu";
import { eventColors } from "../../constants/eventColors";
import { cn } from "../../lib/cn";
import { dayLabel, type DayEntry } from "../../lib/calendar";
import { eventTime } from "../../lib/planner";
import type { CalendarEvent } from "../../types/calendar";
import Button from "../ui/Button";
import Dialog from "../ui/Dialog";

interface Props {
  dayKey: string;
  entry?: DayEntry;
  onClose: () => void; // must be stable
  onAdd: () => void;
  onEdit: (e: CalendarEvent) => void;
  onToggleTask: (id: string) => void;
}

export default function DayModal({
  dayKey,
  entry,
  onClose,
  onAdd,
  onEdit,
  onToggleTask,
}: Props) {
  const events = entry?.events ?? [];
  const tasks = entry?.tasks ?? [];

  return (
    <Dialog
      open
      onClose={onClose}
      title={dayLabel(dayKey)}
      footer={
        <>
          <Button onClick={onClose}>Close</Button>
          <Button variant="primary" onClick={onAdd}>
            Add event
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        {events.length > 0 && (
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onEdit(e)}
                  className="flex w-full items-start gap-3 rounded-xl border border-zinc-200 p-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-1.5 size-2.5 shrink-0 rounded-full",
                      eventColors[e.color].dot,
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-zinc-500">
                      {eventTime(e)}
                    </span>
                    <span className="block truncate text-sm font-medium">
                      {e.title}
                    </span>
                    {e.description && (
                      <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500">
                        {e.description}
                      </span>
                    )}
                    {e.source === "lumi" && (
                      <span className="mt-1 inline-block rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Added by Lumi
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-zinc-500">Edit</span>
                </button>
              </li>
            ))}
          </ul>
        )}

        {tasks.length > 0 && (
          <div>
            <h3 className="mb-2 text-xs font-medium text-zinc-500">
              Tasks due
            </h3>
            <ul className="space-y-2">
              {tasks.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={t.completed}
                    onClick={() => onToggleTask(t.id)}
                    className="flex w-full items-center gap-3 text-left text-sm"
                  >
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-md border",
                        t.completed
                          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                          : "border-zinc-300 dark:border-zinc-700",
                      )}
                    >
                      {t.completed && <LuCheck className="size-3.5" />}
                    </span>
                    <span
                      className={cn(
                        t.completed && "text-zinc-500 line-through",
                      )}
                    >
                      {t.title}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Dialog>
  );
}

import { cn } from "../../lib/cn";
import { toDayKey, todayKey } from "../../lib/planner";
import type { DayEntry } from "../../lib/calendar";

interface Props {
  monthKey: string;
  days: Date[];
  index: Map<string, DayEntry>;
  selectedKey: string;
  onSelect: (key: string) => void;
}

const weekdays = Array.from({ length: 7 }, (_, i) =>
  new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(
    new Date(2023, 0, 1 + i),
  ),
);
const fullDate = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
});

export default function MonthGrid({
  monthKey,
  days,
  index,
  selectedKey,
  onSelect,
}: Props) {
  const today = todayKey();

  return (
    <div
      role="grid"
      aria-label="Month calendar"
      className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800"
    >
      <div
        role="row"
        className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950"
      >
        {weekdays.map((w) => (
          <div
            key={w}
            role="columnheader"
            className="py-2 text-center text-xs font-medium text-zinc-500"
          >
            <span className="sm:hidden">{w[0]}</span>
            <span className="hidden sm:inline">{w}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((d, i) => {
          const key = toDayKey(d);
          const entry = index.get(key);
          const events = entry?.events ?? [];
          const tasks = (entry?.tasks ?? []).filter((t) => !t.completed);
          const inMonth = key.startsWith(monthKey);
          const selected = key === selectedKey;
          const isToday = key === today;
          const items = events.length + tasks.length;

          return (
            <button
              key={key}
              type="button"
              role="gridcell"
              aria-selected={selected}
              aria-label={`${fullDate.format(d)}: ${events.length} events, ${tasks.length} tasks due`}
              onClick={() => onSelect(key)}
              className={cn(
                "flex min-h-14 min-w-0 flex-col gap-1 border-zinc-200 p-1 text-left transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 sm:min-h-24 sm:p-1.5 dark:border-zinc-800 dark:focus-visible:outline-zinc-100",
                i % 7 !== 0 && "border-l",
                i >= 7 && "border-t",
                selected
                  ? "bg-zinc-100 dark:bg-zinc-900"
                  : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
              )}
            >
              <span
                className={cn(
                  "inline-flex size-6 items-center justify-center self-start rounded-full text-xs font-medium",
                  isToday &&
                    "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900",
                  !isToday && !inMonth && "text-zinc-400 dark:text-zinc-600",
                )}
              >
                {d.getDate()}
              </span>

              {/* phones: dots */}
              <span aria-hidden className="flex flex-wrap gap-0.5 sm:hidden">
                {events.slice(0, 4).map((e) => (
                  <span
                    key={e.id}
                    className={cn(
                      "size-1.5 rounded-full",
                      e.createdByLumi
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-zinc-400",
                    )}
                  />
                ))}
                {tasks.slice(0, 2).map((t) => (
                  <span
                    key={t.id}
                    className="size-1.5 rounded-[2px] border border-zinc-500"
                  />
                ))}
              </span>

              {/* larger screens: chips */}
              <span
                aria-hidden
                className="hidden min-w-0 flex-col gap-0.5 sm:flex"
              >
                {events.slice(0, 2).map((e) => (
                  <span
                    key={e.id}
                    className={cn(
                      "truncate rounded px-1.5 py-0.5 text-[11px] leading-4",
                      e.createdByLumi
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
                    )}
                  >
                    {e.title}
                  </span>
                ))}
                {events.length < 2 &&
                  tasks.slice(0, 2 - events.length).map((t) => (
                    <span
                      key={t.id}
                      className="truncate rounded border border-zinc-300 px-1.5 py-0.5 text-[11px] leading-4 dark:border-zinc-700"
                    >
                      {t.title}
                    </span>
                  ))}
                {items > 2 && (
                  <span className="px-1.5 text-[11px] text-zinc-500">
                    +{items - 2} more
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

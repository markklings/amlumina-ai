import { todayUtc } from "../../lib/dates";
import { formatNumber } from "../../lib/format";
import type { UsageDay } from "../../types/usage";

const weekday = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  timeZone: "UTC",
});
const dayLabel = (day: string) =>
  day === todayUtc() ? "Today" : weekday.format(new Date(`${day}T00:00:00Z`));

export default function UsageChart({
  days,
  limit,
}: {
  days: UsageDay[];
  limit: number;
}) {
  const max = Math.max(limit, ...days.map((d) => d.input + d.output));
  const limitPct = (limit / max) * 100;

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xs font-medium text-zinc-500">Last 7 days</h2>
        <ul className="flex items-center gap-4 text-xs text-zinc-500">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-sm bg-zinc-400 dark:bg-zinc-600"
            />
            Input
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-sm bg-zinc-900 dark:bg-zinc-100"
            />
            Output
          </li>
        </ul>
      </div>

      <div className="relative mt-8 h-44">
        <div
          aria-hidden
          className="absolute inset-x-0 border-t border-dashed border-zinc-300 dark:border-zinc-700"
          style={{ bottom: `${limitPct}%` }}
        >
          <span className="absolute -top-5 right-0 text-[10px] text-zinc-500">
            Daily limit
          </span>
        </div>

        <ol className="absolute inset-0 flex items-end gap-2 sm:gap-4">
          {days.map((d) => {
            const total = d.input + d.output;
            return (
              <li
                key={d.day}
                title={`${dayLabel(d.day)}: ${formatNumber(total)} tokens`}
                className="flex h-full min-w-0 flex-1 items-end"
              >
                <span className="sr-only">
                  {dayLabel(d.day)}: {formatNumber(total)} tokens
                </span>
                <div
                  aria-hidden
                  className="flex w-full flex-col justify-end overflow-hidden rounded-md transition-[height] duration-700 ease-out"
                  style={{
                    height: `${(total / max) * 100}%`,
                    minHeight: total > 0 ? 4 : 2,
                  }}
                >
                  {total === 0 ? (
                    <div className="h-full bg-zinc-200 dark:bg-zinc-800" />
                  ) : (
                    <>
                      <div
                        className="bg-zinc-900 dark:bg-zinc-100"
                        style={{ flex: d.output }}
                      />
                      <div
                        className="bg-zinc-400 dark:bg-zinc-600"
                        style={{ flex: d.input }}
                      />
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      <ol aria-hidden className="mt-2 flex gap-2 sm:gap-4">
        {days.map((d) => (
          <li
            key={d.day}
            className="min-w-0 flex-1 truncate text-center text-xs text-zinc-500"
          >
            {dayLabel(d.day)}
          </li>
        ))}
      </ol>
    </section>
  );
}

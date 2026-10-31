import { useEffect, useState } from "react";
import { LuClock } from "react-icons/lu";
import { untilUtcMidnight } from "../../lib/dates";
import { formatNumber } from "../../lib/format";

interface Props {
  input: number;
  output: number;
  limit: number;
}

export default function UsageMeter({ input, output, limit }: Props) {
  const used = input + output;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const reset = untilUtcMidnight();

  // grows from 0 on mount
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(pct));
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <section className="rounded-2xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h2 className="text-xs font-medium text-zinc-500">Today</h2>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2">
        <span className="text-4xl font-semibold tracking-tight tabular-nums">
          {formatNumber(used)}
        </span>
        <span className="text-sm text-zinc-500">
          of {formatNumber(limit)} tokens
        </span>
      </p>

      <div
        role="progressbar"
        aria-label="Daily token usage"
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={Math.min(used, limit)}
        className="mt-4 h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
      >
        <div
          className="h-full rounded-full bg-zinc-900 transition-[width] duration-700 ease-out dark:bg-zinc-100"
          style={{ width: `${width}%` }}
        />
      </div>

      {pct >= 90 && (
        <p role="status" className="mt-3 text-sm font-medium">
          {pct >= 100
            ? "You have reached today's limit."
            : "You are close to today's limit."}
        </p>
      )}

      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        {[
          ["Input", formatNumber(input)],
          ["Output", formatNumber(output)],
          ["Remaining", formatNumber(Math.max(0, limit - used))],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-xs text-zinc-500">{label}</dt>
            <dd className="mt-0.5 font-medium tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 flex items-center gap-2 text-xs text-zinc-500">
        <LuClock className="size-3.5 shrink-0" />
        Resets in {reset.text} (00:00 UTC, {reset.local} your time)
      </p>
    </section>
  );
}

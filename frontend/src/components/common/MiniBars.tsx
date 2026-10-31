import { formatNumber } from "../../lib/format";

const weekday = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const short = new Intl.DateTimeFormat("en-US", {
  month: "numeric",
  day: "numeric",
});

export default function MiniBars({
  items,
  label,
  unit = "",
  dates = false,
}: {
  items: { day: string; value: number }[];
  label: string;
  unit?: string;
  dates?: boolean;
}) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <section className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800">
      <h2 className="text-xs font-medium text-zinc-500">{label}</h2>
      <ol className="mt-4 flex h-28 items-end gap-1.5">
        {items.map((i) => (
          <li
            key={i.day}
            className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1"
            title={`${i.day}: ${formatNumber(i.value)}${unit}`}
          >
            <span className="sr-only">
              {i.day}: {formatNumber(i.value)}
              {unit}
            </span>
            <div
              aria-hidden
              className="w-full rounded-md bg-zinc-900 transition-[height] duration-500 dark:bg-zinc-100"
              style={{
                height: `${(i.value / max) * 100}%`,
                minHeight: i.value ? 4 : 2,
                opacity: i.value ? 1 : 0.15,
              }}
            />
            <span aria-hidden className="truncate text-[10px] text-zinc-500">
              {(dates ? short : weekday).format(new Date(`${i.day}T12:00:00`))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

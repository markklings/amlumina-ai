import { cn } from "../../lib/cn";

interface Tab<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface Props<T extends string> {
  tabs: Tab<T>[];
  value: T;
  label: string;
  onChange: (value: T) => void;
}

export default function Tabs<T extends string>({
  tabs,
  value,
  label,
  onChange,
}: Props<T>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800"
    >
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.value)}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
              active
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100",
            )}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 text-xs text-zinc-500">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

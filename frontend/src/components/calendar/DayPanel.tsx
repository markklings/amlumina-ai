import { LuCheck, LuExternalLink, LuMapPin } from "react-icons/lu";
import { cn } from "../../lib/cn";
import { dayLabel, type DayEntry } from "../../lib/calendar";
import { eventTime } from "../../lib/planner";
import Button from "../ui/Button";
import IconLink from "../ui/IconLink";

interface Props {
  dayKey: string;
  entry?: DayEntry;
  onPlan: () => void;
}

export default function DayPanel({ dayKey, entry, onPlan }: Props) {
  const events = entry?.events ?? [];
  const tasks = entry?.tasks ?? [];

  return (
    <section
      aria-label={`Details for ${dayLabel(dayKey)}`}
      className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800"
    >
      <h2 className="text-sm font-semibold">{dayLabel(dayKey)}</h2>

      {events.length === 0 && tasks.length === 0 && (
        <p className="mt-3 text-sm text-zinc-500">
          Nothing planned for this day.
        </p>
      )}

      {events.length > 0 && (
        <ul className="mt-3 space-y-3">
          {events.map((e) => (
            <li key={e.id} className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-zinc-500">{eventTime(e)}</p>
                <p className="text-sm font-medium">{e.title}</p>
                {e.location && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-zinc-500">
                    <LuMapPin className="size-3 shrink-0" />
                    {e.location}
                  </p>
                )}
                {e.createdByLumi && (
                  <span className="mt-1 inline-block rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    Study plan
                  </span>
                )}
              </div>
              <IconLink href={e.link} label="Open in Google Calendar">
                <LuExternalLink className="size-4" />
              </IconLink>
            </li>
          ))}
        </ul>
      )}

      {tasks.length > 0 && (
        <>
          <h3 className="mb-2 mt-5 text-xs font-medium text-zinc-500">
            Tasks due
          </h3>
          <ul className="space-y-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className={cn(
                  "flex items-center gap-2 text-sm",
                  t.completed && "text-zinc-500 line-through",
                )}
              >
                {t.completed ? (
                  <LuCheck className="size-4 shrink-0" />
                ) : (
                  <span className="size-4 shrink-0 rounded-[3px] border border-zinc-400" />
                )}
                {t.title}
              </li>
            ))}
          </ul>
        </>
      )}

      <Button size="sm" className="mt-5 w-full" onClick={onPlan}>
        Plan this day with Lumi
      </Button>
    </section>
  );
}

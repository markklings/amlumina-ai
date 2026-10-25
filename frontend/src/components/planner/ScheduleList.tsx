import { useMemo } from "react";
import { LuCalendar, LuExternalLink, LuMapPin } from "react-icons/lu";
import { cn } from "../../lib/cn";
import { eventTime, groupEventsByDay, isEnded } from "../../lib/planner";
import type { PlannerEvent } from "../../types/planner";
import StateView from "../common/StateView";
import Button from "../ui/Button";
import IconLink from "../ui/IconLink";

interface Props {
  events: PlannerEvent[];
  connected: boolean;
  onConnect: () => void;
}

export default function ScheduleList({ events, connected, onConnect }: Props) {
  const groups = useMemo(() => groupEventsByDay(events), [events]);

  if (!connected) {
    return (
      <StateView
        icon={LuCalendar}
        title="Google Calendar is not connected"
        description="Connect it to see your schedule and study sessions here."
        action={
          <Button variant="primary" onClick={onConnect}>
            Connect in Settings
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      {groups.map((g) => (
        <section key={g.key}>
          <h3 className="mb-2 text-xs font-medium text-zinc-500">{g.label}</h3>
          {g.events.length ? (
            <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {g.events.map((e) => (
                <li key={e.id} className="flex items-start gap-3 px-4 py-3">
                  <p className="w-28 shrink-0 pt-0.5 text-xs text-zinc-500">
                    {eventTime(e)}
                  </p>
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        isEnded(e) && "text-zinc-500",
                      )}
                    >
                      {e.title}
                    </p>
                    {e.createdByLumi && (
                      <span className="mt-1 inline-block rounded-full border border-zinc-300 px-2 py-0.5 text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                        Study plan
                      </span>
                    )}
                    {e.location && (
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
                        <LuMapPin className="size-3 shrink-0" />
                        {e.location}
                      </p>
                    )}
                  </div>
                  <IconLink href={e.link} label="Open in Google Calendar">
                    <LuExternalLink className="size-4" />
                  </IconLink>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
              Nothing scheduled.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}

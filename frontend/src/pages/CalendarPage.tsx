import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LuCalendar,
  LuChevronLeft,
  LuChevronRight,
  LuRefreshCw,
} from "react-icons/lu";
import DayPanel from "../components/calendar/DayPanel";
import MonthGrid from "../components/calendar/MonthGrid";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import { useCalendarMonth } from "../hooks/useCalendarMonth";
import {
  gridDays,
  indexByDay,
  monthKeyOf,
  monthLabel,
  shiftMonth,
} from "../lib/calendar";
import { dayLabel } from "../lib/calendar";
import { todayKey } from "../lib/planner";
import { paths } from "../router/paths";
import type { ResourceStatus } from "../types/resource";

export default function CalendarPage() {
  const navigate = useNavigate();
  const [monthKey, setMonthKey] = useState(() => monthKeyOf(new Date()));
  const [selectedKey, setSelectedKey] = useState(todayKey);
  const { status, data, refetch } = useCalendarMonth(monthKey);

  const days = useMemo(() => gridDays(monthKey), [monthKey]);
  const index = useMemo(
    () => indexByDay(data.calendar.events, data.tasks.items),
    [data],
  );

  const goMonth = (key: string) => {
    setMonthKey(key);
    setSelectedKey(key === monthKeyOf(new Date()) ? todayKey() : `${key}-01`);
  };

  const askLumi = (prompt: string) =>
    navigate(paths.chat, { state: { prompt } });
  const openSettings = () =>
    navigate(paths.chat, { state: { openSettings: true } });

  const view: ResourceStatus =
    status === "ready" && !data.calendar.connected && !data.tasks.connected
      ? "disconnected"
      : status;

  return (
    <>
      <PageHeader
        title="Calendar"
        description="Your events, tasks and the study plans Lumi created."
        actions={
          <>
            <Button size="sm" onClick={refetch} disabled={status === "loading"}>
              <LuRefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() =>
                askLumi(
                  "Make a weekly study schedule for me based on my calendar and upcoming deadlines.",
                )
              }
            >
              Make study schedule
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <IconButton
            label="Previous month"
            onClick={() => goMonth(shiftMonth(monthKey, -1))}
          >
            <LuChevronLeft className="size-5" />
          </IconButton>
          <h2
            aria-live="polite"
            className="min-w-40 text-center text-base font-semibold"
          >
            {monthLabel(monthKey)}
          </h2>
          <IconButton
            label="Next month"
            onClick={() => goMonth(shiftMonth(monthKey, 1))}
          >
            <LuChevronRight className="size-5" />
          </IconButton>
          <Button
            size="sm"
            className="ml-2"
            onClick={() => goMonth(monthKeyOf(new Date()))}
          >
            Today
          </Button>
        </div>

        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-full bg-zinc-900 dark:bg-zinc-100"
            />
            Study plan (Lumi)
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="size-2.5 rounded-full bg-zinc-400" />
            Other event
          </li>
          <li className="flex items-center gap-1.5">
            <span
              aria-hidden
              className="size-2.5 rounded-[3px] border border-zinc-500"
            />
            Task due
          </li>
        </ul>
      </div>

      <ResourceView
        status={view}
        onRetry={refetch}
        skeleton={
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Skeleton className="h-[480px] w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        }
        empty={
          <StateView
            icon={LuCalendar}
            title="Nothing here"
            description="No events or tasks in this range."
          />
        }
        disconnected={
          <StateView
            icon={LuCalendar}
            title="Calendar and Tasks are not connected"
            description="Connect Google Calendar and Google Tasks to see your schedule here."
            action={
              <Button variant="primary" onClick={openSettings}>
                Connect in Settings
              </Button>
            }
          />
        }
      >
        <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
          <MonthGrid
            monthKey={monthKey}
            days={days}
            index={index}
            selectedKey={selectedKey}
            onSelect={setSelectedKey}
          />
          <DayPanel
            dayKey={selectedKey}
            entry={index.get(selectedKey)}
            onPlan={() =>
              askLumi(
                `Plan a study session for me on ${dayLabel(selectedKey)} and add it to my Google Calendar.`,
              )
            }
          />
        </div>
      </ResourceView>
    </>
  );
}

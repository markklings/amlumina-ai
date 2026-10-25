import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LuCalendarDays, LuRefreshCw } from "react-icons/lu";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import ScheduleList from "../components/planner/ScheduleList";
import TaskList from "../components/planner/TaskList";
import Button from "../components/ui/Button";
// import { mockPlanner } from "../mocks/planner";
// import { useMockResource } from "../mocks/useMockResource";
import { paths } from "../router/paths";
import type { ResourceStatus } from "../types/resource";
import { plannerApi } from "../api/data.api";
import { usePlanner } from "../hooks/usePlanner";

const PLAN_PROMPT =
  "Make a weekly study schedule for me based on my calendar and upcoming deadlines.";

export default function PlannerPage() {
  const navigate = useNavigate();
  const { status, data, refetch } = usePlanner();
  const [tasks, setTasks] = useState(data.tasks.items);

  const askLumi = (prompt: string) =>
    navigate(paths.chat, { state: { prompt } });
  const openSettings = () =>
    navigate(paths.chat, { state: { openSettings: true } });

  useEffect(() => {
    setTasks(data.tasks.items);
  }, [data]);

  // later: PATCH /api/planner/tasks/:id { completed } (optimistic, roll back on error)
  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const next = !task.completed;
    setTasks((list) =>
      list.map((t) => (t.id === id ? { ...t, completed: next } : t)),
    );
    try {
      await plannerApi.setTaskCompleted(id, next);
    } catch {
      setTasks((list) =>
        list.map((t) => (t.id === id ? { ...t, completed: !next } : t)),
      );
    }
  };

  const noApps = !data.calendar.connected && !data.tasks.connected;
  const nothing = data.calendar.events.length === 0 && tasks.length === 0;
  const view: ResourceStatus =
    status === "ready"
      ? noApps
        ? "disconnected"
        : nothing
          ? "empty"
          : "ready"
      : status;

  return (
    <>
      <PageHeader
        title="Planner"
        description="Your next 14 days from Google Calendar and Google Tasks."
        actions={
          <>
            <Button size="sm" onClick={refetch} disabled={status === "loading"}>
              <LuRefreshCw className="size-3.5" />
              Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => askLumi(PLAN_PROMPT)}
            >
              Make study plan
            </Button>
          </>
        }
      />

      <ResourceView
        status={view}
        onRetry={refetch}
        skeleton={
          <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </div>
        }
        empty={
          <StateView
            icon={LuCalendarDays}
            title="Nothing planned yet"
            description="Ask Lumi to build a study schedule and it will show up here."
            action={
              <Button variant="primary" onClick={() => askLumi(PLAN_PROMPT)}>
                Make study plan
              </Button>
            }
          />
        }
        disconnected={
          <StateView
            icon={LuCalendarDays}
            title="Calendar and Tasks are not connected"
            description="Connect Google Calendar and Google Tasks to plan your studies here."
            action={
              <Button variant="primary" onClick={openSettings}>
                Connect in Settings
              </Button>
            }
          />
        }
      >
        <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
          <section aria-labelledby="schedule-title">
            <h2 id="schedule-title" className="mb-3 text-sm font-semibold">
              Schedule
            </h2>
            <ScheduleList
              events={data.calendar.events}
              connected={data.calendar.connected}
              onConnect={openSettings}
            />
          </section>

          <section aria-labelledby="tasks-title">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 id="tasks-title" className="text-sm font-semibold">
                Tasks
              </h2>
              {data.tasks.connected && (
                <Button
                  size="sm"
                  onClick={() =>
                    askLumi("Add these study tasks to Google Tasks: ")
                  }
                >
                  Add with Lumi
                </Button>
              )}
            </div>
            <TaskList
              tasks={tasks}
              connected={data.tasks.connected}
              onToggle={toggleTask}
              onConnect={openSettings}
            />
          </section>
        </div>
      </ResourceView>
    </>
  );
}

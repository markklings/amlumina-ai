import { LuCheck, LuListTodo } from "react-icons/lu";
import { cn } from "../../lib/cn";
import { taskDue } from "../../lib/planner";
import type { PlannerTask } from "../../types/planner";
import StateView from "../common/StateView";
import Button from "../ui/Button";

interface Props {
  tasks: PlannerTask[];
  connected: boolean;
  onToggle: (id: string) => void;
  onConnect: () => void;
}

function TaskRow({
  task,
  onToggle,
}: {
  task: PlannerTask;
  onToggle: (id: string) => void;
}) {
  const due = taskDue(task);

  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
        onClick={() => onToggle(task.id)}
        className={cn(
          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
          task.completed
            ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
            : "border-zinc-300 hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-100",
        )}
      >
        {task.completed && <LuCheck className="size-3.5 animate-fade-in" />}
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium",
            task.completed && "text-zinc-500 line-through",
          )}
        >
          {task.title}
        </p>
        {(due || task.notes) && (
          <p className="mt-0.5 text-xs text-zinc-500">
            {due && (
              <span
                className={cn(
                  due.overdue && "font-medium text-zinc-900 dark:text-zinc-100",
                )}
              >
                {due.label}
              </span>
            )}
            {due && task.notes && " · "}
            {task.notes}
          </p>
        )}
      </div>
    </li>
  );
}

export default function TaskList({
  tasks,
  connected,
  onToggle,
  onConnect,
}: Props) {
  if (!connected) {
    return (
      <StateView
        icon={LuListTodo}
        title="Google Tasks is not connected"
        description="Connect it to see and check off your study tasks."
        action={
          <Button variant="primary" onClick={onConnect}>
            Connect in Settings
          </Button>
        }
      />
    );
  }

  const byDue = (a: PlannerTask, b: PlannerTask) =>
    (a.due ?? "9999").localeCompare(b.due ?? "9999");
  const todo = tasks.filter((t) => !t.completed).sort(byDue);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-2 text-xs font-medium text-zinc-500">
          To do · {todo.length}
        </h3>
        {todo.length ? (
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {todo.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
            You are all caught up.
          </p>
        )}
      </section>

      {done.length > 0 && (
        <section>
          <h3 className="mb-2 text-xs font-medium text-zinc-500">
            Done · {done.length}
          </h3>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {done.map((t) => (
              <TaskRow key={t.id} task={t} onToggle={onToggle} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

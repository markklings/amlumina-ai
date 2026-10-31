import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LuCheck, LuListTodo, LuTrash2 } from "react-icons/lu";
import FormError from "../components/auth/FormError";
import PageHeader from "../components/common/PageHeader";
import ResourceView from "../components/common/ResourceView";
import Skeleton from "../components/common/Skeleton";
import StateView from "../components/common/StateView";
import Button from "../components/ui/Button";
import IconButton from "../components/ui/IconButton";
import { useTasks } from "../hooks/useTasks";
import { cn } from "../lib/cn";
import { taskDue } from "../lib/planner";
import { paths } from "../router/paths";
import type { TaskItem } from "../types/calendar";

const field =
  "h-11 rounded-lg border border-zinc-200 bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100";

function Row({
  task,
  onToggle,
  onRemove,
}: {
  task: TaskItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const due = taskDue(task);
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.completed}
        aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
        onClick={onToggle}
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
            "break-words text-sm font-medium",
            task.completed && "text-zinc-500 line-through",
          )}
        >
          {task.title}
        </p>
        {(due ||
          task.notes ||
          (task.remindDays !== null && !task.completed)) && (
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
            {task.remindDays !== null && !task.completed && (
              <span className="text-xs text-zinc-500">
                {" "}
                · Email reminder set
              </span>
            )}
          </p>
        )}
      </div>
      <IconButton
        label={`Delete task: ${task.title}`}
        onClick={onRemove}
        className="size-8"
      >
        <LuTrash2 className="size-4" />
      </IconButton>
    </li>
  );
}

export default function TasksPage() {
  const navigate = useNavigate();
  const { status, tasks, refetch, add, toggle, remove } = useTasks();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [remind, setRemind] = useState(""); // "" none, "0" on the day, "1" a day before, "2" two days before
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    setError(null);
    try {
      await add({
        title: title.trim(),
        due: due || null,
        remindDays: due && remind !== "" ? Number(remind) : null,
      });
      setTitle("");
      setDue("");
      setRemind("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add the task.");
    } finally {
      setAdding(false);
    }
  };

  const removeTask = async (id: string) => {
    try {
      await remove(id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the task.",
      );
    }
  };

  const byDue = (a: TaskItem, b: TaskItem) =>
    (a.due ?? "9999").localeCompare(b.due ?? "9999");
  const todo = tasks.filter((t) => !t.completed).sort(byDue);
  const done = tasks.filter((t) => t.completed);

  const list = (items: TaskItem[]) => (
    <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {items.map((t) => (
        <Row
          key={t.id}
          task={t}
          onToggle={() => void toggle(t.id)}
          onRemove={() => void removeTask(t.id)}
        />
      ))}
    </ul>
  );

  return (
    <>
      <PageHeader
        title="Tasks"
        description="Your study to-do list. Tasks with a due date also show on the calendar."
        actions={
          <Button
            size="sm"
            variant="primary"
            onClick={() =>
              navigate(paths.chat, {
                state: { prompt: "Add these study tasks: " },
              })
            }
          >
            Add with Lumi
          </Button>
        }
      />

      <form onSubmit={submit} className="mb-8 flex flex-wrap gap-2">
        <input
          aria-label="New task"
          placeholder="Add a task"
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={cn(field, "min-w-0 flex-1 basis-56")}
        />
        <input
          aria-label="Due date"
          type="date"
          value={due}
          onChange={(e) => setDue(e.target.value)}
          className={cn(field, "w-44")}
        />
        <select
          aria-label="Email reminder"
          value={remind}
          disabled={!due}
          onChange={(e) => setRemind(e.target.value)}
          className={cn(field, "w-44 disabled:opacity-50")}
        >
          <option value="">No reminder</option>
          <option value="0">Remind on the day</option>
          <option value="1">Remind 1 day before</option>
          <option value="2">Remind 2 days before</option>
        </select>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={adding}
          disabled={!title.trim()}
        >
          Add
        </Button>
      </form>
      {error && (
        <div className="mb-6">
          <FormError message={error} />
        </div>
      )}

      <ResourceView
        status={status}
        onRetry={refetch}
        skeleton={
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        }
        empty={null}
      >
        {tasks.length === 0 ? (
          <StateView
            icon={LuListTodo}
            title="No tasks yet"
            description="Add your first task above, or ask Lumi to make a study checklist."
          />
        ) : (
          <div className="space-y-6">
            <section>
              <h2 className="mb-2 text-xs font-medium text-zinc-500">
                To do · {todo.length}
              </h2>
              {todo.length ? (
                list(todo)
              ) : (
                <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
                  You are all caught up.
                </p>
              )}
            </section>
            {done.length > 0 && (
              <section>
                <h2 className="mb-2 text-xs font-medium text-zinc-500">
                  Done · {done.length}
                </h2>
                {list(done)}
              </section>
            )}
          </div>
        )}
      </ResourceView>
    </>
  );
}

// import { useState, type FormEvent } from "react";
// import { useNavigate } from "react-router-dom";
// import { LuCheck, LuListTodo, LuTrash2 } from "react-icons/lu";
// import FormError from "../components/auth/FormError";
// import PageHeader from "../components/common/PageHeader";
// import ResourceView from "../components/common/ResourceView";
// import Skeleton from "../components/common/Skeleton";
// import StateView from "../components/common/StateView";
// import Button from "../components/ui/Button";
// import IconButton from "../components/ui/IconButton";
// import { useTasks } from "../hooks/useTasks";
// import { cn } from "../lib/cn";
// import { taskDue } from "../lib/planner";
// import { paths } from "../router/paths";
// import type { TaskItem } from "../types/calendar";
//
// const field =
//   "h-11 rounded-lg border border-zinc-200 bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-900 dark:border-zinc-800 dark:placeholder:text-zinc-500 dark:focus:border-zinc-100";
//
// function Row({
//   task,
//   onToggle,
//   onRemove,
// }: {
//   task: TaskItem;
//   onToggle: () => void;
//   onRemove: () => void;
// }) {
//   const due = taskDue(task);
//   return (
//     <li className="flex items-start gap-3 px-4 py-3">
//       <button
//         type="button"
//         role="checkbox"
//         aria-checked={task.completed}
//         aria-label={`Mark "${task.title}" as ${task.completed ? "not done" : "done"}`}
//         onClick={onToggle}
//         className={cn(
//           "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
//           task.completed
//             ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
//             : "border-zinc-300 hover:border-zinc-900 dark:border-zinc-700 dark:hover:border-zinc-100",
//         )}
//       >
//         {task.completed && <LuCheck className="size-3.5 animate-fade-in" />}
//       </button>
//       <div className="min-w-0 flex-1">
//         <p
//           className={cn(
//             "break-words text-sm font-medium",
//             task.completed && "text-zinc-500 line-through",
//           )}
//         >
//           {task.title}
//         </p>
//         {(due || task.notes) && (
//           <p className="mt-0.5 text-xs text-zinc-500">
//             {due && (
//               <span
//                 className={cn(
//                   due.overdue && "font-medium text-zinc-900 dark:text-zinc-100",
//                 )}
//               >
//                 {due.label}
//               </span>
//             )}
//             {due && task.notes && " · "}
//             {task.notes}
//           </p>
//         )}
//       </div>
//       <IconButton
//         label={`Delete task: ${task.title}`}
//         onClick={onRemove}
//         className="size-8"
//       >
//         <LuTrash2 className="size-4" />
//       </IconButton>
//     </li>
//   );
// }
//
// export default function TasksPage() {
//   const navigate = useNavigate();
//   const { status, tasks, refetch, add, toggle, remove } = useTasks();
//   const [title, setTitle] = useState("");
//   const [due, setDue] = useState("");
//   const [adding, setAdding] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//
//   const submit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!title.trim()) return;
//     setAdding(true);
//     setError(null);
//     try {
//       await add({ title: title.trim(), due: due || null });
//       setTitle("");
//       setDue("");
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Could not add the task.");
//     } finally {
//       setAdding(false);
//     }
//   };
//
//   const removeTask = async (id: string) => {
//     try {
//       await remove(id);
//     } catch (err) {
//       setError(
//         err instanceof Error ? err.message : "Could not delete the task.",
//       );
//     }
//   };
//
//   const byDue = (a: TaskItem, b: TaskItem) =>
//     (a.due ?? "9999").localeCompare(b.due ?? "9999");
//   const todo = tasks.filter((t) => !t.completed).sort(byDue);
//   const done = tasks.filter((t) => t.completed);
//
//   const list = (items: TaskItem[]) => (
//     <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
//       {items.map((t) => (
//         <Row
//           key={t.id}
//           task={t}
//           onToggle={() => void toggle(t.id)}
//           onRemove={() => void removeTask(t.id)}
//         />
//       ))}
//     </ul>
//   );
//
//   return (
//     <>
//       <PageHeader
//         title="Tasks"
//         description="Your study to-do list. Tasks with a due date also show on the calendar."
//         actions={
//           <Button
//             size="sm"
//             variant="primary"
//             onClick={() =>
//               navigate(paths.chat, {
//                 state: { prompt: "Add these study tasks: " },
//               })
//             }
//           >
//             Add with Lumi
//           </Button>
//         }
//       />
//
//       <form onSubmit={submit} className="mb-8 flex flex-wrap gap-2">
//         <input
//           aria-label="New task"
//           placeholder="Add a task"
//           maxLength={255}
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           className={cn(field, "min-w-0 flex-1 basis-56")}
//         />
//         <input
//           aria-label="Due date"
//           type="date"
//           value={due}
//           onChange={(e) => setDue(e.target.value)}
//           className={cn(field, "w-44")}
//         />
//         <Button
//           type="submit"
//           variant="primary"
//           size="lg"
//           loading={adding}
//           disabled={!title.trim()}
//         >
//           Add
//         </Button>
//       </form>
//       {error && (
//         <div className="mb-6">
//           <FormError message={error} />
//         </div>
//       )}
//
//       <ResourceView
//         status={status}
//         onRetry={refetch}
//         skeleton={
//           <div className="space-y-3">
//             {[0, 1, 2, 3].map((i) => (
//               <Skeleton key={i} className="h-14 w-full" />
//             ))}
//           </div>
//         }
//         empty={null}
//       >
//         {tasks.length === 0 ? (
//           <StateView
//             icon={LuListTodo}
//             title="No tasks yet"
//             description="Add your first task above, or ask Lumi to make a study checklist."
//           />
//         ) : (
//           <div className="space-y-6">
//             <section>
//               <h2 className="mb-2 text-xs font-medium text-zinc-500">
//                 To do · {todo.length}
//               </h2>
//               {todo.length ? (
//                 list(todo)
//               ) : (
//                 <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-sm text-zinc-500 dark:border-zinc-800">
//                   You are all caught up.
//                 </p>
//               )}
//             </section>
//             {done.length > 0 && (
//               <section>
//                 <h2 className="mb-2 text-xs font-medium text-zinc-500">
//                   Done · {done.length}
//                 </h2>
//                 {list(done)}
//               </section>
//             )}
//           </div>
//         )}
//       </ResourceView>
//     </>
//   );
// }

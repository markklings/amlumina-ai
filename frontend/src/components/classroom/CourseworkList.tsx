import {
  LuCircleAlert,
  LuCircleCheck,
  LuClock,
  LuExternalLink,
  LuInbox,
} from "react-icons/lu";
import { formatDateTime, isPast } from "../../lib/dates";
import { statusOf } from "../../lib/classroom";
import type { Coursework } from "../../types/classroom";
import StateView from "../common/StateView";
import Button from "../ui/Button";
import IconLink from "../ui/IconLink";

interface Props {
  items: Coursework[];
  courseName: (id: string) => string;
  onPlan: (work: Coursework) => void;
}

function Row({
  work,
  course,
  onPlan,
}: {
  work: Coursework;
  course: string;
  onPlan: (w: Coursework) => void;
}) {
  const status = statusOf(work);
  const Icon = status.done
    ? LuCircleCheck
    : isPast(work.due)
      ? LuCircleAlert
      : LuClock;

  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <Icon className="size-5 shrink-0 text-zinc-500" />
      <div className="min-w-0 flex-1 basis-48">
        <p className="truncate text-sm font-medium">{work.title}</p>
        <p className="mt-0.5 text-xs text-zinc-500">
          {course} ·{" "}
          {work.due ? `Due ${formatDateTime(work.due)}` : "No due date"}
          {work.points !== null && ` · ${work.points} pts`}
        </p>
      </div>
      <span className="shrink-0 rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
        {status.label}
      </span>
      <div className="flex shrink-0 items-center gap-1">
        {!status.done && work.due && (
          <Button size="sm" onClick={() => onPlan(work)}>
            Plan with Lumi
          </Button>
        )}
        <IconLink href={work.link} label="Open in Google Classroom">
          <LuExternalLink className="size-4" />
        </IconLink>
      </div>
    </li>
  );
}

function Group({
  title,
  items,
  courseName,
  onPlan,
}: {
  title: string;
  items: Coursework[];
  courseName: Props["courseName"];
  onPlan: Props["onPlan"];
}) {
  if (!items.length) return null;
  return (
    <section>
      <h2 className="mb-2 text-xs font-medium text-zinc-500">
        {title} · {items.length}
      </h2>
      <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
        {items.map((w) => (
          <Row
            key={w.id}
            work={w}
            course={courseName(w.courseId)}
            onPlan={onPlan}
          />
        ))}
      </ul>
    </section>
  );
}

export default function CourseworkList({ items, courseName, onPlan }: Props) {
  if (!items.length) {
    return (
      <StateView
        icon={LuInbox}
        title="No coursework"
        description="Nothing is posted for this selection."
      />
    );
  }

  const byDueAsc = (a: Coursework, b: Coursework) =>
    (a.due ?? "9").localeCompare(b.due ?? "9");
  const todo = items.filter((w) => !statusOf(w).done).sort(byDueAsc);
  const done = items
    .filter((w) => statusOf(w).done)
    .sort((a, b) => byDueAsc(b, a));

  return (
    <div className="space-y-6">
      <Group
        title="To do"
        items={todo}
        courseName={courseName}
        onPlan={onPlan}
      />
      <Group
        title="Done"
        items={done}
        courseName={courseName}
        onPlan={onPlan}
      />
    </div>
  );
}

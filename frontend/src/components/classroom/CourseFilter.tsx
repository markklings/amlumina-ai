import { cn } from "../../lib/cn";
import type { Course } from "../../types/classroom";

interface Props {
  courses: Course[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900",
      )}
    >
      {children}
    </button>
  );
}

export default function CourseFilter({ courses, selectedId, onSelect }: Props) {
  return (
    <div
      role="group"
      aria-label="Filter by course"
      className="flex flex-wrap gap-2"
    >
      <Chip active={selectedId === null} onClick={() => onSelect(null)}>
        All courses
      </Chip>
      {courses.map((c) => (
        <Chip
          key={c.id}
          active={selectedId === c.id}
          onClick={() => onSelect(c.id)}
        >
          {c.name}
        </Chip>
      ))}
    </div>
  );
}

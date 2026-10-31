import { LuExternalLink, LuMegaphone } from "react-icons/lu";
import { relativeTime } from "../../lib/dates";
import type { Announcement } from "../../types/classroom";
import StateView from "../common/StateView";
import IconLink from "../ui/IconLink";

interface Props {
  items: Announcement[];
  courseName: (id: string) => string;
}

export default function AnnouncementList({ items, courseName }: Props) {
  if (!items.length) {
    return (
      <StateView
        icon={LuMegaphone}
        title="No announcements"
        description="Nothing is posted for this selection."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((a) => (
        <li
          key={a.id}
          className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="min-w-0 flex-1">
            <p className="text-xs text-zinc-500">
              {courseName(a.courseId)} · {relativeTime(a.updatedAt)}
            </p>
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6">
              {a.text}
            </p>
          </div>
          <IconLink href={a.link} label="Open in Google Classroom">
            <LuExternalLink className="size-4" />
          </IconLink>
        </li>
      ))}
    </ul>
  );
}

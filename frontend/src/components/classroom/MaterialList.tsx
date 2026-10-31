import type { IconType } from "react-icons";
import {
  LuExternalLink,
  LuFileText,
  LuLink,
  LuPaperclip,
  LuVideo,
} from "react-icons/lu";
import type { CourseMaterial, MaterialFileType } from "../../types/classroom";
import StateView from "../common/StateView";
import IconLink from "../ui/IconLink";

const FILE_ICON: Record<MaterialFileType, IconType> = {
  drive: LuFileText,
  link: LuLink,
  video: LuVideo,
  form: LuFileText,
};

interface Props {
  items: CourseMaterial[];
  courseName: (id: string) => string;
}

export default function MaterialList({ items, courseName }: Props) {
  if (!items.length) {
    return (
      <StateView
        icon={LuPaperclip}
        title="No materials"
        description="Nothing is posted for this selection."
      />
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li
          key={m.id}
          className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{m.title}</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                {courseName(m.courseId)}
                {m.description && ` · ${m.description}`}
              </p>
            </div>
            <IconLink href={m.link} label="Open in Google Classroom">
              <LuExternalLink className="size-4" />
            </IconLink>
          </div>
          {m.files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {m.files.map((f) => {
                const Icon = FILE_ICON[f.type];
                return (
                  <li key={f.url + f.title}>
                    <a
                      href={f.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                    >
                      <Icon className="size-3.5" />
                      {f.title}
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </li>
      ))}
    </ul>
  );
}

import type { ReactNode } from "react";
import type { IconType } from "react-icons";

interface Props {
  icon: IconType;
  title: string;
  description?: string;
  action?: ReactNode;
}

export default function StateView({
  icon: Icon,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex animate-fade-up flex-col items-center gap-2 rounded-2xl border border-dashed border-zinc-200 px-6 py-14 text-center dark:border-zinc-800">
      <Icon className="size-6 text-zinc-500" />
      <h2 className="text-base font-semibold">{title}</h2>
      {description && (
        <p className="max-w-sm text-sm text-zinc-500">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

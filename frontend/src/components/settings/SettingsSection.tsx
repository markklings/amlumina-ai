import type { ReactNode } from "react";

interface Props {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsSection({
  title,
  description,
  children,
}: Props) {
  return (
    <section className="px-4 py-5">
      <h3 className="text-xs font-medium text-zinc-500">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      )}
      <div className="mt-3">{children}</div>
    </section>
  );
}

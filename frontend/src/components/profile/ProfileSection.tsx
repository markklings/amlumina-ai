import type { ReactNode } from "react";

interface Props {
  title: string;
  description: string;
  children: ReactNode;
}

export default function ProfileSection({
  title,
  description,
  children,
}: Props) {
  return (
    <section className="grid gap-4 py-8 sm:grid-cols-[220px_1fr] sm:gap-10">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs text-zinc-500">{description}</p>
      </div>
      <div className="max-w-md">{children}</div>
    </section>
  );
}

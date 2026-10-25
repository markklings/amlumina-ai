import { LuCheck } from "react-icons/lu";

export default function InlineStatus({ children }: { children: string }) {
  return (
    <p
      role="status"
      className="flex animate-fade-in items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400"
    >
      <LuCheck className="size-4" />
      {children}
    </p>
  );
}

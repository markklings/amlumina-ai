export default function Divider({ label = "or" }: { label?: string }) {
  return (
    <div
      className="flex items-center gap-3 text-xs text-zinc-500"
      role="separator"
    >
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
      {label}
      <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
    </div>
  );
}

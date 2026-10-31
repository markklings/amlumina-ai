import { LuCircleAlert } from "react-icons/lu";

export default function FormError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex animate-fade-in items-start gap-2 rounded-lg border border-zinc-300 px-3 py-2.5 text-sm dark:border-zinc-700"
    >
      <LuCircleAlert className="mt-0.5 size-4 shrink-0" />
      {message}
    </p>
  );
}

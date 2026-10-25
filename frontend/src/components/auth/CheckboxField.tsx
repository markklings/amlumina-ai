import { useId, type ReactNode } from "react";
import { LuCheck, LuCircleAlert } from "react-icons/lu";
import { cn } from "../../lib/cn";

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  children: ReactNode;
}

export default function CheckboxField({
  checked,
  onChange,
  error,
  children,
}: Props) {
  const errorId = `${useId()}-error`;

  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-zinc-900 dark:peer-focus-visible:outline-zinc-100",
            checked
              ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
              : error
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-zinc-300 dark:border-zinc-700",
          )}
        >
          {checked && <LuCheck className="size-3.5 animate-fade-in" />}
        </span>
        <span className="text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {children}
        </span>
      </label>
      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-1.5 flex animate-fade-in items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400"
        >
          <LuCircleAlert className="size-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

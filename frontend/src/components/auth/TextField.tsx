import { useId, type InputHTMLAttributes, type ReactNode } from "react";
import { LuCircleAlert } from "react-icons/lu";
import { cn } from "../../lib/cn";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  trailing?: ReactNode;
  labelAction?: ReactNode; // e.g. a "Forgot password?" link
}

export default function TextField({
  label,
  error,
  trailing,
  labelAction,
  id,
  className,
  ...rest
}: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const errorId = `${inputId}-error`;

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <label htmlFor={inputId} className="block text-sm font-medium">
          {label}
        </label>
        {labelAction}
      </div>
      <div className="relative">
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "h-11 w-full rounded-lg border bg-transparent px-3.5 text-sm outline-none transition-colors placeholder:text-zinc-400 disabled:cursor-not-allowed disabled:opacity-60 dark:placeholder:text-zinc-500",
            error
              ? "border-zinc-900 dark:border-zinc-100"
              : "border-zinc-200 focus:border-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100",
            trailing && "pr-11",
            className,
          )}
          {...rest}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-1 flex items-center">
            {trailing}
          </div>
        )}
      </div>
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

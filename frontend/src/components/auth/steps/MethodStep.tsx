import type { FormEvent } from "react";
import { LuCheck } from "react-icons/lu";
import { learningMethods } from "../../../constants/methods";
import { cn } from "../../../lib/cn";
import FormError from "../FormError";
import StepActions from "../StepActions";
import StepShell from "../StepShell";

interface Props {
  value: number;
  onChange: (id: number) => void;
  onNext: () => void;
  onBack?: () => void;
  nextLabel?: string;
  loading?: boolean;
  error?: string | null;
  focusOnMount?: boolean;
}

export default function MethodStep({
  value,
  onChange,
  onNext,
  onBack,
  nextLabel = "Continue",
  loading,
  error,
  focusOnMount,
}: Props) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <form onSubmit={submit}>
      <StepShell
        title="Choose how you learn"
        description="Lumi teaches in this style. You can change it any time."
        focusOnMount={focusOnMount}
        footer={
          <StepActions
            nextLabel={nextLabel}
            loading={loading}
            onBack={onBack}
          />
        }
      >
        <div className="space-y-3">
          {error && <FormError message={error} />}
          <div
            role="radiogroup"
            aria-label="Learning method"
            className="grid gap-2 sm:grid-cols-2"
          >
            {learningMethods.map((m, i) => {
              const Icon = m.icon;
              const active = m.id === value;
              return (
                <button
                  key={m.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => onChange(m.id)}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className={cn(
                    "flex animate-fade-up items-start gap-3 rounded-xl border p-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
                    active
                      ? "border-zinc-900 bg-zinc-50 dark:border-zinc-100 dark:bg-zinc-900"
                      : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900/60",
                  )}
                >
                  <Icon className="mt-0.5 size-5 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium">
                      {m.name}
                      {m.recommended && (
                        <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700">
                          Recommended
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-xs text-zinc-500">
                      {m.description}
                    </span>
                  </span>
                  <span className="mt-0.5 size-4 shrink-0">
                    {active && <LuCheck className="size-4 animate-fade-in" />}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </StepShell>
    </form>
  );
}

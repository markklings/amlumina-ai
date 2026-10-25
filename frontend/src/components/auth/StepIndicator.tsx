interface Props {
  steps: string[];
  current: number;
}

export default function StepIndicator({ steps, current }: Props) {
  return (
    <div className="mb-6">
      <p
        aria-live="polite"
        className="mb-2 text-center text-xs font-medium text-zinc-500"
      >
        Step {current + 1} of {steps.length} · {steps[current]}
      </p>
      <div aria-hidden className="flex gap-1.5">
        {steps.map((label, i) => (
          <span
            key={label}
            className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
          >
            <span
              className={`block h-full origin-left bg-zinc-900 transition-transform duration-500 ease-out dark:bg-zinc-100 ${
                i <= current ? "scale-x-100" : "scale-x-0"
              }`}
            />
          </span>
        ))}
      </div>
    </div>
  );
}

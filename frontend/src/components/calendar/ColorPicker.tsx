import { eventColorList, eventColors } from "../../constants/eventColors";
import { cn } from "../../lib/cn";
import type { EventColor } from "../../types/calendar";

export default function ColorPicker({
  value,
  onChange,
}: {
  value: EventColor;
  onChange: (c: EventColor) => void;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Event color"
      className="flex flex-wrap gap-2"
    >
      {eventColorList.map((c) => {
        const active = c === value;
        return (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={eventColors[c].label}
            title={eventColors[c].label}
            onClick={() => onChange(c)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full border-2 transition-transform focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-zinc-100",
              active
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-transparent hover:scale-110",
            )}
          >
            <span className={cn("size-5 rounded-full", eventColors[c].dot)} />
          </button>
        );
      })}
    </div>
  );
}

import { LuCheck, LuChevronDown } from "react-icons/lu";
import { useDisclosure } from "../../hooks/useDisclosure";
import { useDismiss } from "../../hooks/useDismiss";
import { cn } from "../../lib/cn";
import type { LearningMethod } from "../../types/method";

interface Props {
  methods: LearningMethod[];
  selectedId: number;
  onSelect: (id: number) => void;
}

export default function MethodMenu({ methods, selectedId, onSelect }: Props) {
  const { open, toggle, hide } = useDisclosure();
  const ref = useDismiss<HTMLDivElement>(open, hide);
  const selected = methods.find((m) => m.id === selectedId) ?? methods[0];
  const SelectedIcon = selected.icon;

  return (
    <div ref={ref} className="min-w-0 sm:relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex max-w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:hover:bg-zinc-900 dark:focus-visible:outline-zinc-100"
      >
        <SelectedIcon className="size-4 shrink-0" />
        <span className="truncate">{selected.name}</span>
        <LuChevronDown
          className={cn(
            "size-4 shrink-0 text-zinc-500 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-3 top-full z-30 mt-1 w-80 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-zinc-200 bg-white p-1.5 sm:left-0 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="px-3 pb-1 pt-2 text-xs font-medium text-zinc-500">
            Learning method
          </p>

          <ul role="menu" aria-label="Learning method">
            {methods.map((m) => {
              const Icon = m.icon;
              const active = m.id === selectedId;
              return (
                <li key={m.id} role="none">
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={active}
                    onClick={() => {
                      onSelect(m.id);
                      hide();
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-zinc-100 dark:bg-zinc-900"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-900/60",
                    )}
                  >
                    <Icon className="mt-0.5 size-4 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        {m.name}
                        {m.recommended && (
                          <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-medium text-zinc-500 dark:border-zinc-700">
                            Recommended
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-xs text-zinc-500">
                        {m.description}
                      </span>
                    </span>
                    {active && <LuCheck className="mt-0.5 size-4 shrink-0" />}
                  </button>
                </li>
              );
            })}
          </ul>

          <p className="mt-1 border-t border-zinc-200 px-3 pb-2 pt-3 text-xs text-zinc-500 dark:border-zinc-800">
            Applies to new chats. Existing chats keep the method they started
            with.
          </p>
        </div>
      )}
    </div>
  );
}

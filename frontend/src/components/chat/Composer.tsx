import { useEffect, useRef, type KeyboardEvent } from "react";
import { LuArrowUp, LuSquare } from "react-icons/lu";
import { APP_CHARACTER, APP_NAME } from "../../constants/app";

interface Props {
  value: string;
  isStreaming: boolean;
  focusToken: number;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
}

export default function Composer({
  value,
  isStreaming,
  focusToken,
  onChange,
  onSend,
  onStop,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [value]);

  useEffect(() => {
    const el = ref.current;
    if (!focusToken || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [focusToken]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  };

  const canSend = value.trim().length > 0;

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-2">
      <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white py-2 pl-5 pr-2 transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
        <textarea
          ref={ref}
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label={`Message ${APP_CHARACTER}`}
          placeholder={`Ask ${APP_CHARACTER} anything`}
          className="max-h-52 min-h-6 w-full resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="Stop generating"
            title="Stop generating"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            <LuSquare className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
          >
            <LuArrowUp className="size-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        {APP_NAME} can make mistakes. Check important info.
      </p>
    </div>
  );
}

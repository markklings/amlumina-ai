import { useEffect, useRef, type ChangeEvent, type KeyboardEvent } from "react";
import {
  LuArrowUp,
  LuFileText,
  LuPaperclip,
  LuSquare,
  LuX,
} from "react-icons/lu";
import { APP_NAME } from "../../constants/app";
import { useI18n } from "../../hooks/useI18n";
import type { Attachment } from "../../api/files.api";

interface Props {
  value: string;
  isStreaming: boolean;
  focusToken: number;
  attachments: Attachment[];
  uploading: boolean;
  attachError: string | null;
  onChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onAttach: (file: File) => void;
  onRemoveAttachment: (id: string) => void;
}

export default function Composer(p: Props) {
  const { t } = useI18n();
  const ref = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [p.value]);

  useEffect(() => {
    const el = ref.current;
    if (!p.focusToken || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [p.focusToken]);

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      p.onSend();
    }
  };

  const pick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) p.onAttach(f);
    e.target.value = "";
  };

  const canSend = p.value.trim().length > 0 && !p.uploading;
  const round =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors";

  return (
    <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-2">
      {(p.attachments.length > 0 || p.uploading || p.attachError) && (
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {p.attachments.map((a) => (
            <span
              key={a.id}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 py-1 pl-3 pr-1 text-xs dark:border-zinc-800"
            >
              <LuFileText className="size-3.5 shrink-0" />
              <span className="truncate">{a.name}</span>
              {a.truncated && (
                <span className="text-zinc-500">(shortened)</span>
              )}
              <button
                type="button"
                aria-label={`Remove ${a.name}`}
                onClick={() => p.onRemoveAttachment(a.id)}
                className="rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <LuX className="size-3" />
              </button>
            </span>
          ))}
          {p.uploading && (
            <span className="text-xs text-zinc-500">Reading file…</span>
          )}
          {p.attachError && (
            <span
              role="alert"
              className="text-xs text-zinc-600 dark:text-zinc-400"
            >
              {p.attachError}
            </span>
          )}
        </div>
      )}

      <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white py-2 pl-2 pr-2 transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".txt,.md,.csv,.pdf,text/plain,application/pdf"
          onChange={pick}
        />
        <button
          type="button"
          aria-label={t("composer.attach")}
          title={t("composer.attach")}
          disabled={p.uploading || p.attachments.length >= 3}
          onClick={() => fileRef.current?.click()}
          className={`${round} text-zinc-600 hover:bg-zinc-100 disabled:opacity-40 dark:text-zinc-400 dark:hover:bg-zinc-900`}
        >
          <LuPaperclip className="size-5" />
        </button>

        <textarea
          ref={ref}
          rows={1}
          value={p.value}
          onChange={(e) => p.onChange(e.target.value)}
          onKeyDown={onKeyDown}
          aria-label={t("composer.placeholder", { app: APP_NAME })}
          placeholder={t("composer.placeholder", { app: APP_NAME })}
          className="max-h-52 min-h-6 w-full resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
        />

        {p.isStreaming ? (
          <button
            type="button"
            onClick={p.onStop}
            aria-label="Stop generating"
            title="Stop generating"
            className={`${round} bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300`}
          >
            <LuSquare className="size-3.5 fill-current" />
          </button>
        ) : (
          <button
            type="button"
            onClick={p.onSend}
            disabled={!canSend}
            aria-label="Send message"
            title="Send message"
            className={`${round} bg-zinc-900 text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600`}
          >
            <LuArrowUp className="size-5" />
          </button>
        )}
      </div>
      <p className="mt-2 text-center text-xs text-zinc-500">
        {t("composer.disclaimer", { app: APP_NAME })}
      </p>
    </div>
  );
}

// import { useEffect, useRef, type KeyboardEvent } from "react";
// import { LuArrowUp, LuSquare } from "react-icons/lu";
// import { APP_CHARACTER, APP_NAME } from "../../constants/app";
//
// interface Props {
//   value: string;
//   isStreaming: boolean;
//   focusToken: number;
//   onChange: (value: string) => void;
//   onSend: () => void;
//   onStop: () => void;
// }
//
// export default function Composer({
//   value,
//   isStreaming,
//   focusToken,
//   onChange,
//   onSend,
//   onStop,
// }: Props) {
//   const ref = useRef<HTMLTextAreaElement>(null);
//
//   useEffect(() => {
//     const el = ref.current;
//     if (!el) return;
//     el.style.height = "auto";
//     el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
//   }, [value]);
//
//   useEffect(() => {
//     const el = ref.current;
//     if (!focusToken || !el) return;
//     el.focus();
//     el.setSelectionRange(el.value.length, el.value.length);
//   }, [focusToken]);
//
//   const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
//     if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
//       e.preventDefault();
//       onSend();
//     }
//   };
//
//   const canSend = value.trim().length > 0;
//
//   return (
//     <div className="mx-auto w-full max-w-3xl shrink-0 px-4 pb-4 pt-2">
//       <div className="flex items-end gap-2 rounded-3xl border border-zinc-200 bg-white py-2 pl-5 pr-2 transition-colors focus-within:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:focus-within:border-zinc-600">
//         <textarea
//           ref={ref}
//           rows={1}
//           value={value}
//           onChange={(e) => onChange(e.target.value)}
//           onKeyDown={onKeyDown}
//           aria-label={`Message ${APP_CHARACTER}`}
//           placeholder={`Ask ${APP_CHARACTER} anything`}
//           className="max-h-52 min-h-6 w-full resize-none bg-transparent py-2 text-[15px] leading-6 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
//         />
//
//         {isStreaming ? (
//           <button
//             type="button"
//             onClick={onStop}
//             aria-label="Stop generating"
//             title="Stop generating"
//             className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
//           >
//             <LuSquare className="size-3.5 fill-current" />
//           </button>
//         ) : (
//           <button
//             type="button"
//             onClick={onSend}
//             disabled={!canSend}
//             aria-label="Send message"
//             title="Send message"
//             className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-200 disabled:text-zinc-400 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 dark:disabled:bg-zinc-800 dark:disabled:text-zinc-600"
//           >
//             <LuArrowUp className="size-5" />
//           </button>
//         )}
//       </div>
//       <p className="mt-2 text-center text-xs text-zinc-500">
//         {APP_NAME} can make mistakes. Check important info.
//       </p>
//     </div>
//   );
// }

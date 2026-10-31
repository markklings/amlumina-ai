import { useEffect, useLayoutEffect, useRef } from "react";
import { useI18n } from "../../hooks/useI18n";
import type { Message } from "../../types/chat";
import Button from "../ui/Button";
import MessageBubble from "./MessageBubble";

interface Props {
  messages: Message[];
  hasMore?: boolean;
  loadingOlder?: boolean;
  onLoadOlder?: () => void;
  onRetry?: (id: string) => void;
}

export default function MessageList({
  messages,
  hasMore,
  loadingOlder,
  onLoadOlder,
  onRetry,
}: Props) {
  const { t } = useI18n();
  const scroller = useRef<HTMLDivElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const stick = useRef(true);
  const anchor = useRef<number | null>(null); // scrollHeight before older messages were added

  const onScroll = () => {
    const el = scroller.current;
    if (el)
      stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const loadOlder = () => {
    anchor.current = scroller.current?.scrollHeight ?? null;
    onLoadOlder?.();
  };

  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && anchor.current !== null && !loadingOlder) {
      el.scrollTop = el.scrollHeight - anchor.current;
      anchor.current = null;
      return;
    }
    if (anchor.current === null && stick.current)
      end.current?.scrollIntoView({ block: "end" });
  }, [messages, loadingOlder]);

  useEffect(() => {
    if (!loadingOlder && !hasMore) anchor.current = null;
  }, [loadingOlder, hasMore]);

  return (
    <div
      ref={scroller}
      onScroll={onScroll}
      className="min-h-0 flex-1 overflow-y-auto"
    >
      <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
        {hasMore && (
          <div className="flex justify-center">
            <Button size="sm" loading={loadingOlder} onClick={loadOlder}>
              {t("chat.loadOlder")}
            </Button>
          </div>
        )}
        {messages.map((m, n) => (
          <MessageBubble
            key={m.id}
            message={m}
            onRetry={
              onRetry && n === messages.length - 1 && m.role === "assistant"
                ? () => onRetry(m.id)
                : undefined
            }
          />
        ))}
        <div ref={end} />
      </div>
    </div>
  );
}

// import { useEffect, useRef } from "react";
// import type { Message } from "../../types/chat";
// import MessageBubble from "./MessageBubble";
//
// export default function MessageList({
//   messages,
//   onRetry,
// }: {
//   messages: Message[];
//   onRetry?: (id: string) => void;
// }) {
//   const scrollerRef = useRef<HTMLDivElement>(null);
//   const endRef = useRef<HTMLDivElement>(null);
//   const stickRef = useRef(true);
//
//   const onScroll = () => {
//     const el = scrollerRef.current;
//     if (!el) return;
//     stickRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
//   };
//
//   useEffect(() => {
//     if (stickRef.current) endRef.current?.scrollIntoView({ block: "end" });
//   }, [messages]);
//
//   return (
//     <div
//       ref={scrollerRef}
//       onScroll={onScroll}
//       className="min-h-0 flex-1 overflow-y-auto"
//     >
//       <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-6">
//         {messages.map((m, n) => (
//           <MessageBubble
//             key={m.id}
//             message={m}
//             onRetry={
//               onRetry && n === messages.length - 1 && m.role === "assistant"
//                 ? () => onRetry(m.id)
//                 : undefined
//             }
//           />
//         ))}
//         <div ref={endRef} />
//       </div>
//     </div>
//   );
// }

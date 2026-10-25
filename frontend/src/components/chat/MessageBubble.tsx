import type { Message } from "../../types/chat";
import LumiMark from "../ui/LumiMark";
import ToolActivity from "./ToolActivity";
import MarkdownContent from "./MarkdownContent";

export default function MessageBubble({ message }: { message: Message }) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap break-words rounded-3xl bg-zinc-100 px-5 py-3 text-[15px] leading-7 dark:bg-zinc-900">
          {message.content}
        </div>
      </div>
    );
  }

  const showDots =
    message.status === "streaming" &&
    !message.content &&
    message.toolCalls.every((t) => t.status !== "running");

  return (
    <div className="flex gap-4">
      <LumiMark className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <ToolActivity calls={message.toolCalls} />

        {showDots && (
          <div className="flex h-7 items-center gap-1" aria-label="Thinking">
            {[0, 150, 300].map((delay) => (
              <span
                key={delay}
                className="size-1.5 animate-pulse rounded-full bg-zinc-400"
                style={{ animationDelay: `${delay}ms` }}
              />
            ))}
          </div>
        )}

        {message.content && <MarkdownContent content={message.content} />}

        {message.status === "stopped" && (
          <p className="mt-2 text-xs text-zinc-500">Stopped</p>
        )}
        {message.status === "error" && (
          <p className="mt-2 text-xs text-zinc-500">
            {message.errorMessage ?? "Something went wrong. Try again."}
          </p>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { LuSparkles } from "react-icons/lu";
import { AVATAR } from "../../constants/app";
import { cn } from "../../lib/cn";

const frame =
  "inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full";

export default function LumiMark({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        aria-hidden
        className={cn(
          frame,
          "border border-zinc-200 text-zinc-900 dark:border-zinc-800 dark:text-zinc-100",
          className,
        )}
      >
        <LuSparkles className="size-4" />
      </span>
    );
  }

  return (
    <span aria-hidden className={cn(frame, className)}>
      <img
        src={AVATAR}
        alt=""
        draggable={false}
        onError={() => setFailed(true)}
        className={cn("size-full object-cover", AVATAR && "dark:hidden")}
      />
      {AVATAR && (
        <img
          src={AVATAR}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="hidden size-full object-cover dark:block"
        />
      )}
    </span>
  );
}

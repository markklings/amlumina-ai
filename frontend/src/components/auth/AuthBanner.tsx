import { useState } from "react";
import { AUTH_BANNER_CAPTION, AUTH_BANNER_SRC } from "../../constants/app";
import { cn } from "../../lib/cn";

export default function AuthBanner({ className }: { className?: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <aside
      aria-hidden
      className={cn("relative overflow-hidden bg-zinc-900", className)}
    >
      {!failed && (
        <img
          src={AUTH_BANNER_SRC}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          className="absolute inset-0 size-full animate-fade-in object-cover"
        />
      )}
      {AUTH_BANNER_CAPTION && (
        <>
          <div className="absolute inset-0 bg-black/25" />
          <p className="absolute inset-x-0 bottom-0 animate-fade-up p-12 text-3xl font-semibold tracking-tight text-white [animation-delay:300ms]">
            {AUTH_BANNER_CAPTION}
          </p>
        </>
      )}
    </aside>
  );
}

import { useEffect, useRef, useState } from "react";
import { LuWifi, LuWifiOff } from "react-icons/lu";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const online = useOnlineStatus();
  const [showBack, setShowBack] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      setShowBack(false);
      return;
    }
    if (!wasOffline.current) return;
    setShowBack(true);
    const timer = window.setTimeout(() => setShowBack(false), 2500);
    return () => window.clearTimeout(timer);
  }, [online]);

  if (online && !showBack) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-16 z-[70] flex justify-center px-4"
    >
      <p className="pointer-events-auto flex animate-fade-up items-center gap-2 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-950">
        {online ? (
          <>
            <LuWifi className="size-4 shrink-0" />
            Back online
          </>
        ) : (
          <>
            <LuWifiOff className="size-4 shrink-0" />
            You are offline. Changes will not save until you reconnect.
          </>
        )}
      </p>
    </div>
  );
}

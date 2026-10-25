import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../api/ApiError";
import type { ResourceStatus } from "../types/resource";

export function useResource<T>(
  fetcher: (signal: AbortSignal) => Promise<T>,
  initial: T,
  isEmpty?: (data: T) => boolean,
  key = "",
) {
  const [state, setState] = useState<{ status: ResourceStatus; data: T }>({
    status: "loading",
    data: initial,
  });
  const [run, setRun] = useState(0);
  const latest = useRef({ fetcher, initial, isEmpty });

  useEffect(() => {
    latest.current = { fetcher, initial, isEmpty };
  });

  useEffect(() => {
    const controller = new AbortController();
    const { fetcher: load, initial: empty, isEmpty: check } = latest.current;
    setState((s) => ({ ...s, status: "loading" }));

    load(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ status: check?.(data) ? "empty" : "ready", data });
      },
      (e: unknown) => {
        if (controller.signal.aborted) return;
        // // 409 APP_NOT_CONNECTED → the page's "connect it in Settings" state
        // const status: ResourceStatus =
        //   e instanceof ApiError && e.code === "APP_NOT_CONNECTED"
        //     ? "disconnected"
        //     : "error";
        // setState({ status, data: empty });
        const reconnect =
          e instanceof ApiError &&
          (e.code === "APP_NOT_CONNECTED" ||
            e.code === "GOOGLE_RECONNECT_REQUIRED");
        const status: ResourceStatus = reconnect ? "disconnected" : "error";
        setState({ status, data: empty });
      },
    );
    return () => controller.abort();
  }, [run, key]);

  const refetch = useCallback(() => setRun((r) => r + 1), []);
  return { status: state.status, data: state.data, refetch };
}

import { useMemo } from "react";
import { plannerApi } from "../api/data.api";
import { gridRange } from "../lib/calendar";
import type { PlannerData } from "../types/planner";
import { useResource } from "./useResource";

const EMPTY: PlannerData = {
  calendar: { connected: false, events: [] },
  tasks: { connected: false, items: [] },
};

export function useCalendarMonth(monthKey: string) {
  const range = useMemo(() => gridRange(monthKey), [monthKey]);
  return useResource(
    (signal) => plannerApi.overview(signal, range),
    EMPTY,
    undefined,
    monthKey,
  );
}

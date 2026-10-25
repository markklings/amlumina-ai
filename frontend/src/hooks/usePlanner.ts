import { plannerApi } from "../api/data.api";
import type { PlannerData } from "../types/planner";
import { useResource } from "./useResource";

const EMPTY: PlannerData = {
  calendar: { connected: false, events: [] },
  tasks: { connected: false, items: [] },
};

// the page decides between "empty" and "disconnected" itself, since it depends on two apps
export const usePlanner = () =>
  useResource((signal) => plannerApi.overview(signal), EMPTY);

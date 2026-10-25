import type { ClassroomData } from "../types/classroom";
import type { LibraryItem } from "../types/library";
import type { PlannerData } from "../types/planner";
import { request } from "./client";

export const classroomApi = {
  overview: (signal?: AbortSignal) =>
    request<ClassroomData>("/api/classroom/overview", { signal }),
};

export const libraryApi = {
  list: async (signal?: AbortSignal) =>
    (await request<{ items: LibraryItem[] }>("/api/library", { signal })).items,
};

export const plannerApi = {
  overview: (signal?: AbortSignal, range?: { from: Date; to: Date }) => {
    const q = range
      ? `?${new URLSearchParams({ from: range.from.toISOString(), to: range.to.toISOString() })}`
      : "";
    return request<PlannerData>(`/api/planner/overview${q}`, { signal });
  },
  setTaskCompleted: (id: string, completed: boolean) =>
    request<{ id: string; completed: boolean }>(
      `/api/planner/tasks/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: { completed },
      },
    ),
};

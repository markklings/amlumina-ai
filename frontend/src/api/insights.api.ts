import type { AdminStats, ProgressData } from "../types/insights";
import { request } from "./client";

export const insightsApi = {
  progress: (today: string, signal?: AbortSignal) =>
    request<ProgressData>(`/api/progress?today=${encodeURIComponent(today)}`, {
      signal,
    }),
  admin: (signal?: AbortSignal) =>
    request<AdminStats>("/api/admin/stats", { signal }),
};

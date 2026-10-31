import type { ClassroomData } from "../types/classroom";
import { request } from "./client";

export const classroomApi = {
  overview: (signal?: AbortSignal) =>
    request<ClassroomData>("/api/classroom/overview", { signal }),
};

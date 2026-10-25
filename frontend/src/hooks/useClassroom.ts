import { classroomApi } from "../api/data.api";
import type { ClassroomData } from "../types/classroom";
import { useResource } from "./useResource";

const EMPTY: ClassroomData = {
  accountEmail: "",
  courses: [],
  coursework: [],
  announcements: [],
  materials: [],
};

export const useClassroom = () =>
  useResource(
    (signal) => classroomApi.overview(signal),
    EMPTY,
    (d) => d.courses.length === 0,
  );

export type SubmissionState =
  "NEW" | "CREATED" | "TURNED_IN" | "RETURNED" | "RECLAIMED_BY_STUDENT";

export interface Course {
  id: string;
  name: string;
  section: string | null;
  link: string;
}

export interface Coursework {
  id: string;
  courseId: string;
  title: string;
  due: string | null; // ISO date-time
  points: number | null;
  submission: SubmissionState | null;
  late: boolean;
  link: string;
}

export interface Announcement {
  id: string;
  courseId: string;
  text: string;
  updatedAt: string;
  link: string;
}

export type MaterialFileType = "drive" | "link" | "video" | "form";

export interface MaterialFile {
  type: MaterialFileType;
  title: string;
  url: string;
}

export interface CourseMaterial {
  id: string;
  courseId: string;
  title: string;
  description: string;
  files: MaterialFile[];
  link: string;
}

export interface ClassroomData {
  accountEmail: string;
  courses: Course[];
  coursework: Coursework[];
  announcements: Announcement[];
  materials: CourseMaterial[];
}

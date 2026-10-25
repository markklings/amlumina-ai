export interface AppDefinition {
  id: number;
  key: string;
  name: string;
  description: string;
  scopes: string[]; // requested from Google
  required: string[]; // minimum needed to count the app as connected
}

const G = "https://www.googleapis.com/auth/";

const app = (
  id: number,
  key: string,
  name: string,
  description: string,
  scopes: string[],
  required: string[] = scopes,
): AppDefinition => ({ id, key, name, description, scopes, required });

export const APPS: AppDefinition[] = [
  app(
    1,
    "google_classroom",
    "Google Classroom",
    "Checking Google Classroom Courses",
    [
      G + "classroom.courses.readonly",
      G + "classroom.coursework.me.readonly",
      G + "classroom.announcements.readonly",
      G + "classroom.courseworkmaterials.readonly",
    ],
    [G + "classroom.courses.readonly"],
  ),
  app(
    2,
    "google_drive",
    "Google Drive",
    "Manage and Store files",
    [G + "drive.file", G + "drive.readonly"],
    [G + "drive.file"],
  ),
  app(
    3,
    "google_docs",
    "Google Docs",
    "Create Docs and Manage Docs",
    [G + "documents", G + "drive.file"],
    [G + "documents"],
  ),
  app(4, "google_sheets", "Google Sheets", "Create Sheets and Manage Sheets", [
    G + "spreadsheets",
  ]),
  app(
    5,
    "google_calendar",
    "Google Calendar",
    "Manage and Store Study Plans And Schedules",
    [G + "calendar"],
  ),
  app(6, "google_tasks", "Google Tasks", "Manage and Store Tasks", [
    G + "tasks",
  ]),
];

export const APP_IDS = APPS.map((a) => a.id);

export const scopesForApps = (ids: number[]) =>
  APPS.filter((a) => ids.includes(a.id)).flatMap((a) => a.scopes);

/** Apps whose REQUIRED scopes were all granted (optional scopes may be missing). */
export const appsFromGrantedScopes = (granted: string): number[] => {
  const set = new Set(granted.split(" ").filter(Boolean));
  return APPS.filter((a) => a.required.every((s) => set.has(s))).map(
    (a) => a.id,
  );
};

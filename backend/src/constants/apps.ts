export interface AppDefinition {
  id: number;
  key: string;
  name: string;
  description: string;
  scopes: string[]; // requested from Google
  required: string[]; // minimum needed to count the app as connected
}

const G = "https://www.googleapis.com/auth/";

export const APPS: AppDefinition[] = [
  {
    id: 1,
    key: "google_classroom",
    name: "Google Classroom",
    description: "Checking Google Classroom Courses",
    scopes: [
      G + "classroom.courses.readonly",
      G + "classroom.coursework.me.readonly",
      G + "classroom.announcements.readonly",
      G + "classroom.courseworkmaterials.readonly",
    ],
    required: [G + "classroom.courses.readonly"],
  },
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

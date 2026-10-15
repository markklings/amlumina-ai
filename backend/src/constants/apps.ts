export interface AppDefinition {
  id: number
  key: string
  name: string
  description: string
  scopes: string[]
}

export const APPS: AppDefinition[] = [
  {
    id: 1,
    key: 'google_classroom',
    name: 'Google Classroom',
    description: 'Check Google Classroom Courses (e.g. Assignments, Course Materials) on the app.',
    scopes: ['https://www.googleapis.com/auth/classroom.courses.readonly']
  },
  {
    id: 2,
    key: 'google_drive',
    name: 'Google Drive',
    description: 'Manage folders and files directly on the app.',
    scopes: ['https://www.googleapis.com/auth/drive.file']
  },
  {
    id: 3,
    key: 'google_docs',
    name: 'Google Docs',
    description: 'Create and manage documents directly on the app.',
    scopes: ['https://www.googleapis.com/auth/documents']
  },
  {
    id: 4,
    key: 'google_sheets',
    name: 'Google Sheets',
    description: 'Create and manage sheets directly on the app.',
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
  },
  {
    id: 5,
    key: 'google_calendar',
    name: 'Google Calendar',
    description: 'Create and Manage study plans and schedules directly on the app.',
    scopes: ['https://www.googleapis.com/auth/calendar']
  },
  {
    id: 6,
    key: 'google_tasks',
    name: 'Google Tasks',
    description: 'Manage and store tasks directly on the app.',
    scopes: ['https://www.googleapis.com/auth/tasks']
  }
]

export const APP_IDS = APPS.map((a) => a.id)

export const scopesForApps = (ids: number[]) =>
  APPS.filter((a) => ids.includes(a.id)).flatMap((a) => a.scopes)

// Which app IDs are fully covered by a space-seperated granted-scopes string on the google url
export const appsFromGrantedScopes = (granted: string): number[] => {
  const set = new Set(granted.split(' '))
  return APPS.filter((a) => a.scopes.every((s) => set.has(s))).map((a) => a.id)
}

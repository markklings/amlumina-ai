export const en = {
  "nav.calendar": "Calendar",
  "nav.tasks": "Tasks",
  "nav.practice": "Practice",
  "nav.focus": "Focus",
  "nav.progress": "Progress",
  "nav.classroom": "Classroom",
  "nav.library": "Library",
  "nav.usage": "Usage",
  "nav.profile": "Profile",
  "nav.admin": "Admin",
  "sidebar.newChat": "New chat",
  "sidebar.quick": "Quick actions",
  "sidebar.workspace": "Workspace",
  "sidebar.settings": "Settings",
  "composer.placeholder": "Ask {app} anything",
  "composer.disclaimer": "{app} can make mistakes. Check important info.",
  "composer.attach": "Attach a file",
  "chat.loadOlder": "Load earlier messages",
  "empty.hello": "Hello, {name}",
  "empty.sub": "What are we studying today?",
  "settings.title": "Settings",
  "settings.appearance": "Appearance",
  "settings.language": "Language",
  "settings.languageHint":
    "Changes the app language and the language Lumi replies in.",
  "settings.studyProfile": "Study profile",
  "settings.logout": "Log out",
  "common.back": "Back to chat",
} as const;

export type DictKey = keyof typeof en;

export const fil: Record<DictKey, string> = {
  "nav.calendar": "Kalendaryo",
  "nav.tasks": "Mga Gawain",
  "nav.practice": "Praktis",
  "nav.focus": "Pokus",
  "nav.progress": "Progreso",
  "nav.classroom": "Classroom",
  "nav.library": "Aklatan",
  "nav.usage": "Paggamit",
  "nav.profile": "Profile",
  "nav.admin": "Admin",
  "sidebar.newChat": "Bagong chat",
  "sidebar.quick": "Mabilisang aksyon",
  "sidebar.workspace": "Workspace",
  "sidebar.settings": "Mga setting",
  "composer.placeholder": "Magtanong kahit ano kay {app}",
  "composer.disclaimer":
    "Maaaring magkamali ang {app}. Suriin ang mahahalagang impormasyon.",
  "composer.attach": "Mag-attach ng file",
  "chat.loadOlder": "Ipakita ang mas naunang mga mensahe",
  "empty.hello": "Kumusta, {name}",
  "empty.sub": "Ano ang pag-aaralan natin ngayon?",
  "settings.title": "Mga setting",
  "settings.appearance": "Hitsura",
  "settings.language": "Wika",
  "settings.languageHint":
    "Binabago ang wika ng app at ang wikang ginagamit ni Lumi sa pagsagot.",
  "settings.studyProfile": "Profile sa pag-aaral",
  "settings.logout": "Mag-log out",
  "common.back": "Bumalik sa chat",
};

export const LANGUAGES = [
  { code: "en", label: "English", aiName: "English" },
  { code: "fil", label: "Filipino", aiName: "Filipino" },
] as const;
export type LangCode = (typeof LANGUAGES)[number]["code"];
export const dictionaries: Record<LangCode, Record<DictKey, string>> = {
  en,
  fil,
};

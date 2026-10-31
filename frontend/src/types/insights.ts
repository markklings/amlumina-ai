export interface ProgressData {
  week: {
    day: string;
    focusMinutes: number;
    reviews: number;
    tokens: number;
  }[];
  focus: { weekMinutes: number };
  cards: {
    total: number;
    due: number;
    reviews7: number;
    goodRate: number | null;
  };
  quizzes: {
    recent: { title: string; percent: number; at: string }[];
    average: number | null;
  };
  tasks: { open: number; overdue: number; dueSoon: number; done7: number };
  chat: { messages7: number; tokens7: number };
}

export interface AdminStats {
  totals: {
    users: number;
    verified: number;
    chats: number;
    messages: number;
    documents: number;
    errors7: number;
  };
  daily: { day: string; signups: number; tokens: number }[];
  models: { model: string; count: number }[];
  topToday: { email: string; name: string; tokens: number }[];
  recentUsers: {
    email: string;
    name: string;
    provider: string;
    verified: boolean;
    createdAt: string;
  }[];
}

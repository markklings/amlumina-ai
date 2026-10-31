export interface DeckSummary {
  id: string;
  title: string;
  total: number;
  due: number;
  createdAt: string;
}
export interface ReviewCard {
  id: string;
  front: string;
  back: string;
}
export interface DeckReview {
  deck: { id: string; title: string };
  cards: ReviewCard[];
  dueTotal: number;
}
export interface QuizSummary {
  id: string;
  title: string;
  questionCount: number;
  attempts: number;
  best: number | null;
}
export interface QuizPublic {
  id: string;
  title: string;
  questions: { prompt: string; options: string[] }[];
}
export interface AttemptResult {
  score: number;
  total: number;
  results: { correct: boolean; answerIndex: number; explanation: string }[];
}
export interface StudyStats {
  todayMinutes: number;
  totalMinutes: number;
  streak: number;
  week: { day: string; minutes: number }[];
}

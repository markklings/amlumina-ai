import type {
  AttemptResult,
  DeckReview,
  DeckSummary,
  QuizPublic,
  QuizSummary,
  StudyStats,
} from "../types/practice";
import { request } from "./client";
import { todayKey } from "../lib/planner";

const e = encodeURIComponent;

export const practiceApi = {
  decks: async (signal?: AbortSignal) =>
    (await request<{ decks: DeckSummary[] }>("/api/practice/decks", { signal }))
      .decks,
  deckReview: (id: string, signal?: AbortSignal) =>
    request<DeckReview>(`/api/practice/decks/${e(id)}/review`, { signal }),
  reviewCard: (id: string, grade: number) =>
    request<{ dueAt: string }>(`/api/practice/cards/${e(id)}/review`, {
      method: "POST",
      body: { grade, day: todayKey() },
    }),
  removeDeck: (id: string) =>
    request<{ deleted: boolean }>(`/api/practice/decks/${e(id)}`, {
      method: "DELETE",
    }),

  quizzes: async (signal?: AbortSignal) =>
    (
      await request<{ quizzes: QuizSummary[] }>("/api/practice/quizzes", {
        signal,
      })
    ).quizzes,
  quiz: (id: string, signal?: AbortSignal) =>
    request<QuizPublic>(`/api/practice/quizzes/${e(id)}`, { signal }),
  attempt: (id: string, answers: (number | null)[]) =>
    request<AttemptResult>(`/api/practice/quizzes/${e(id)}/attempt`, {
      method: "POST",
      body: { answers },
    }),
  removeQuiz: (id: string) =>
    request<{ deleted: boolean }>(`/api/practice/quizzes/${e(id)}`, {
      method: "DELETE",
    }),

  logSession: (minutes: number, day: string, label?: string) =>
    request<{ logged: boolean }>("/api/practice/study-sessions", {
      method: "POST",
      body: { minutes, day, label },
    }),
  stats: (today: string, signal?: AbortSignal) =>
    request<StudyStats>(`/api/practice/study-stats?today=${e(today)}`, {
      signal,
    }),
};

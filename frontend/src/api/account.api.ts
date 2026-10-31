import type { UsageData } from "../types/usage";
import { request } from "./client";
import type { WireTokens, WireUser } from "./mappers";

export const accountApi = {
  chooseMethod: (method_id: number) =>
    request<unknown>("/api/method/choose", {
      method: "POST",
      body: { method_id },
    }),

  saveGeminiKey: (gemini_key: string) =>
    request<{ has_gemini_key: boolean }>("/api/me/gemini-key", {
      method: "PUT",
      body: { gemini_key },
    }),

  updateProfile: (full_name: string) =>
    request<{ user: WireUser }>("/api/me", {
      method: "PATCH",
      body: { full_name },
    }),

  changePassword: (current_password: string, new_password: string) =>
    request<{ changed: boolean; tokens: WireTokens }>("/api/me/password", {
      method: "PUT",
      body: { current_password, new_password },
    }),

  deleteAccount: () =>
    request<{ deleted: boolean }>("/api/me", { method: "DELETE" }),

  usage: (signal?: AbortSignal) =>
    request<UsageData>("/api/me/usage", { signal }),

  preferences: () =>
    request<{
      study_profile: {
        level?: string;
        subjects?: string[];
        goals?: string;
        language?: string;
      };
      email_digest: boolean;
    }>("/api/me/preferences"),
  saveStudyProfile: (p: { level: string; subjects: string[]; goals: string }) =>
    request<unknown>("/api/me/study-profile", { method: "PUT", body: p }),
  setDigest: (email_digest: boolean) =>
    request<unknown>("/api/me/preferences", {
      method: "PUT",
      body: { email_digest },
    }),
  setLanguage: (language: string) =>
    request<unknown>("/api/me/language", { method: "PUT", body: { language } }),
};

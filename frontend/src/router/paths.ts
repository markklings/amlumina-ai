import type { AuthUser } from "../types/user";

export const paths = {
  login: "/login",
  signup: "/signup",
  forgot: "/forgot-password",
  reset: "/reset-password",
  callback: "/auth/callback",
  onboarding: "/onboarding",
  chat: "/chat",
  classroom: "/classroom",
  library: "/library",
  usage: "/usage",
  profile: "/profile",
  terms: "/terms",
  privacy: "/privacy",
  sessionExpired: "/session-expired",
  // planner: "/planner",
  tasks: "/tasks",
  document: "/documents",
  verifyEmail: "/verify-email",
  calendar: "/calendar",
  practice: "/practice",
  focus: "/focus",
  progress: "/progress",
  admin: "/admin",
  home: "/",
} as const;

export const isOnboarded = (u: AuthUser) =>
  u.hasGeminiKey && u.learningMethodId !== null;

export const nextPathFor = (u: AuthUser) =>
  isOnboarded(u) ? paths.chat : paths.onboarding;

import { request } from "./client";
import type { WireAccount, WireTokens, WireUser } from "./mappers";

interface Session {
  user: WireUser;
  tokens: WireTokens;
}

const BASE = "/api/auth/v1";

export const authApi = {
  login: (email: string, password: string) =>
    request<Session>(`${BASE}/login`, {
      method: "POST",
      body: { email, password },
      auth: false,
    }),

  signup: (body: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    gemini_key: string;
    accepted_terms: boolean;
    apps: number[];
  }) =>
    request<Session & { connect_url: string | null }>(`${BASE}/signup`, {
      method: "POST",
      body,
      auth: false,
    }),

  googleUrl: (mode: "login" | "connect", apps: number[] = []) => {
    const q = new URLSearchParams({ mode });
    if (apps.length) q.set("apps", apps.join(","));
    return request<{ url: string }>(`${BASE}/google?${q}`, {
      auth: mode === "connect",
    });
  },

  googleExchange: (code: string) =>
    request<Session>(`${BASE}/google/exchange`, {
      method: "POST",
      body: { code },
      auth: false,
    }),

  me: () =>
    request<{ user: WireUser; connected_accounts: WireAccount[] }>(
      `${BASE}/me`,
    ),

  logout: (refresh_token: string) =>
    request<{ logged_out: boolean }>(`${BASE}/logout`, {
      method: "POST",
      body: { refresh_token },
      auth: false,
    }),

  disconnectAccount: (id: string) =>
    request<{ disconnected: boolean }>(
      `${BASE}/accounts/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),

  forgotPassword: (email: string) =>
    request<{ sent: boolean }>(`${BASE}/forgot-password`, {
      method: "POST",
      body: { email },
      auth: false,
    }),

  resetPassword: (token: string, password: string) =>
    request<{ reset: boolean }>(`${BASE}/reset-password`, {
      method: "POST",
      body: { token, password },
      auth: false,
    }),

  sendVerifyCode: () =>
    request<{ sent?: boolean; email_verified?: boolean }>(
      `${BASE}/verify-email/send`,
      { method: "POST", body: {} },
    ),

  verifyEmail: (code: string) =>
    request<{ email_verified: boolean }>(`${BASE}/verify-email`, {
      method: "POST",
      body: { code },
    }),
};

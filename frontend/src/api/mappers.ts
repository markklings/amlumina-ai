import type { ChatSummary, Message, MessageStatus, Role } from "../types/chat";
import type { AuthUser, ConnectedAccount } from "../types/user";

export interface WireUser {
  id: string;
  full_name: string;
  email: string;
  auth_provider: "local" | "google";
  has_gemini_key: boolean;
  learning_method_id: number | null;
  email_verified: boolean;
}

export interface WireTokens {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export interface WireAccount {
  id: string;
  account_email: string;
  account_type: "personal" | "edu";
  apps: number[];
}

export interface WireChat {
  id: string;
  title: string;
  updated_at: string;
}

export interface WireMessage {
  id: string;
  role: Role;
  content: string;
  status: MessageStatus;
  tool_calls: { name: string; ok: boolean }[];
  created_at: string;
}

export const toAuthUser = (u: WireUser): AuthUser => ({
  id: u.id,
  fullName: u.full_name,
  email: u.email,
  hasGeminiKey: u.has_gemini_key,
  learningMethodId: u.learning_method_id,
  authProvider: u.auth_provider,
  emailVerified: u.email_verified,
});

export const toAccount = (a: WireAccount): ConnectedAccount => ({
  id: a.id,
  email: a.account_email,
  type: a.account_type,
  apps: a.apps,
});

export const toChatSummary = (c: WireChat): ChatSummary => ({
  id: c.id,
  title: c.title,
  updatedAt: c.updated_at,
});

export const toMessage = (m: WireMessage): Message => ({
  id: m.id,
  role: m.role,
  content: m.content,
  status: m.status,
  toolCalls: (m.tool_calls ?? []).map((t) => ({
    id: crypto.randomUUID(),
    name: t.name,
    status: t.ok ? "done" : "error",
  })),
  createdAt: m.created_at,
});

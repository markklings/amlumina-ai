import { createContext } from "react";
import type { AuthUser, ConnectedAccount } from "../types/user";

export interface SignupInput {
  fullName: string;
  email: string;
  password: string;
  geminiKey: string;
  methodId: number;
  apps: number[];
  acceptedTerms: boolean;
}

export interface AuthContextValue {
  user: AuthUser | null;
  accounts: ConnectedAccount[];
  loading: boolean;
  sessionExpired: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: SignupInput) => Promise<{ connectUrl: string | null }>;
  loginWithGoogle: () => Promise<void>;
  completeGoogleLogin: (code: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  saveGeminiKey: (key: string) => Promise<void>;
  chooseMethod: (id: number) => Promise<void>;
  updateProfile: (fullName: string) => Promise<void>;
  changePassword: (current: string, next: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  connectAccount: (apps: number[]) => Promise<void>;
  disconnectAccount: (id: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

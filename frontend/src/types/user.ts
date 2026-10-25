export interface User {
  id: string;
  fullName: string;
  email: string;
}

export interface AuthUser extends User {
  hasGeminiKey: boolean;
  learningMethodId: number | null;
  authProvider: "local" | "google";
  emailVerified: boolean;
}

export type AccountType = "personal" | "edu";

export interface ConnectedAccount {
  id: string;
  email: string;
  type: AccountType;
  apps: number[];
}

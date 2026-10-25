import { google } from "googleapis";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { scopesForApps } from "../constants/apps";

export type GoogleMode = "login" | "connect";
export interface GoogleState {
  mode: GoogleMode;
  apps: number[];
  userId?: string;
}

export const newOAuthClient = () =>
  new google.auth.OAuth2(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    env.GOOGLE_REDIRECT_URI,
  );

export function buildGoogleAuthUrl(state: GoogleState): string {
  const signedState = jwt.sign(state, env.JWT_STATE_SECRET, {
    expiresIn: "10m",
  });
  return newOAuthClient().generateAuthUrl({
    access_type: "offline",
    prompt: "consent select_account",
    include_granted_scopes: true,
    scope: ["openid", "email", "profile", ...scopesForApps(state.apps)],
    state: signedState,
  });
}

export function verifyState(token: string): GoogleState | null {
  try {
    return jwt.verify(token, env.JWT_STATE_SECRET) as GoogleState;
  } catch {
    return null;
  }
}

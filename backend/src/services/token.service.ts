import jwt from "jsonwebtoken";
import { randomBytes } from "node:crypto";
import type { Request } from "express";
import { db } from "../db/index.js";
import { refreshTokens } from "../db/schema.js";
import { env } from "../config/env.js";
import { sha256 } from "../utils/crypto.js";

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: "Bearer";
  expires_in: number;
}

export async function issueTokens(
  userId: string,
  req?: Request,
): Promise<AuthTokens> {
  const access_token = jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });
  const { exp, iat } = jwt.decode(access_token) as { exp: number; iat: number };

  // Opaque refresh token; only its hash is persisted
  const refresh_token = randomBytes(48).toString("hex");
  await db.insert(refreshTokens).values({
    userId: userId,
    tokenHash: sha256(refresh_token),
    userAgent: req?.headers["user-agent"]?.slice(0, 500) ?? null,
    ipAddress: req?.ip ?? null,
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 86_400_000),
  });

  return {
    access_token,
    refresh_token,
    token_type: "Bearer",
    expires_in: exp - iat,
  };
}

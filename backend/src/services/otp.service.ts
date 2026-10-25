import { createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { and, desc, eq, isNull, lt, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { emailOtps } from "../db/schema.js";
import { env } from "../config/env.js";

export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_RESEND_SECONDS = 60;

const hashOtp = (userId: string, code: string) =>
  createHmac("sha256", env.JWT_STATE_SECRET)
    .update(`${userId}:${code}`)
    .digest("hex");

export async function issueOtp(userId: string): Promise<string> {
  await db
    .update(emailOtps)
    .set({ consumedAt: new Date() })
    .where(and(eq(emailOtps.userId, userId), isNull(emailOtps.consumedAt)));

  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.insert(emailOtps).values({
    userId,
    codeHash: hashOtp(userId, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MIN * 60_000),
  });
  return code;
}

export async function secondsUntilResend(userId: string): Promise<number> {
  const [last] = await db
    .select({ createdAt: emailOtps.createdAt })
    .from(emailOtps)
    .where(eq(emailOtps.userId, userId))
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);
  if (!last) return 0;
  return Math.max(
    0,
    Math.ceil(
      (last.createdAt.getTime() + OTP_RESEND_SECONDS * 1000 - Date.now()) /
        1000,
    ),
  );
}

export type OtpResult = "ok" | "invalid" | "expired" | "locked";

export async function verifyOtp(
  userId: string,
  code: string,
): Promise<OtpResult> {
  const [row] = await db
    .select()
    .from(emailOtps)
    .where(and(eq(emailOtps.userId, userId), isNull(emailOtps.consumedAt)))
    .orderBy(desc(emailOtps.createdAt))
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now()) return "expired";
  if (row.attempts >= OTP_MAX_ATTEMPTS) return "locked";

  const [counted] = await db
    .update(emailOtps)
    .set({ attempts: sql`${emailOtps.attempts} + 1` })
    .where(
      and(eq(emailOtps.id, row.id), lt(emailOtps.attempts, OTP_MAX_ATTEMPTS)),
    );
  if (counted.affectedRows === 0) return "locked";

  const a = Buffer.from(row.codeHash, "hex");
  const b = Buffer.from(hashOtp(userId, code), "hex");
  if (a.length !== b.length || !timingSafeEqual(a, b)) return "invalid";

  const [used] = await db
    .update(emailOtps)
    .set({ consumedAt: new Date() })
    .where(and(eq(emailOtps.id, row.id), isNull(emailOtps.consumedAt)));
  return used.affectedRows ? "ok" : "expired";
}

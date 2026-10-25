import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  aiUsage,
  chats,
  connectedApps,
  emailOtps,
  knownDevices,
  libraryItems,
  messages,
  passwordResets,
  refreshTokens,
  users,
  authCodes,
} from "../db/schema.js";
import { decrypt, encrypt } from "../utils/crypto.js";
import { requireAuth } from "../middleware/auth.js";
import { ok, fail } from "../utils/response.js";
import { publicUser } from "../serializers/user.js";
import { mail } from "../services/mail.service.js";
import { issueTokens } from "../services/token.service.js";
import { DAILY_TOKEN_LIMIT } from "../services/usage.service.js";
import { newOAuthClient } from "../services/google.service.js";

const router = Router();
router.use(requireAuth);

const getUser = async (id: string) =>
  (await db.select().from(users).where(eq(users.id, id)).limit(1))[0];

const keySchema = z.object({
  gemini_key: z.string().trim().min(20, "Invalid Gemini API key"),
});

router.put("/gemini-key", async (req, res, next) => {
  try {
    const parsed = keySchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    await db
      .update(users)
      .set({ geminiApiKeyEncrypted: encrypt(parsed.data.gemini_key) })
      .where(eq(users.id, req.userId!));

    const user = await getUser(req.userId!);
    if (user) mail.accountUpdated(user, "Your Gemini API key was updated");
    return ok(res, { has_gemini_key: true });
  } catch (e) {
    next(e);
  }
});

const profileSchema = z.object({
  full_name: z.string().trim().min(2).max(255),
});

router.patch("/", async (req, res, next) => {
  try {
    const parsed = profileSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const before = await getUser(req.userId!);
    if (!before) return fail(res, 404, "USER_NOT_FOUND", "User not found");
    if (before.fullName === parsed.data.full_name)
      return ok(res, { user: publicUser(before) });

    await db
      .update(users)
      .set({ fullName: parsed.data.full_name })
      .where(eq(users.id, before.id));
    const user = (await getUser(before.id))!;
    mail.accountUpdated(user, `Your name was changed to "${user.fullName}"`);
    return ok(res, { user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

const passwordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

router.put("/password", async (req, res, next) => {
  try {
    const parsed = passwordSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const user = await getUser(req.userId!);
    if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");
    if (!user.passwordHash) {
      return fail(
        res,
        400,
        "NO_PASSWORD",
        "This account signs in with Google and has no password.",
      );
    }
    if (
      !(await bcrypt.compare(parsed.data.current_password, user.passwordHash))
    ) {
      return fail(
        res,
        400,
        "INVALID_CREDENTIALS",
        "Current password is incorrect",
      );
    }

    await db
      .update(users)
      .set({ passwordHash: await bcrypt.hash(parsed.data.new_password, 12) })
      .where(eq(users.id, user.id));
    await db.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
    const tokens = await issueTokens(user.id, req);

    mail.passwordChanged(user);
    return ok(res, { changed: true, tokens });
  } catch (e) {
    next(e);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const user = await getUser(req.userId!);
    if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");

    const accounts = await db
      .select()
      .from(connectedApps)
      .where(eq(connectedApps.userId, user.id));
    for (const a of accounts) {
      try {
        const token = a.refreshTokenEncrypted
          ? decrypt(a.refreshTokenEncrypted)
          : a.accessTokenEncrypted
            ? decrypt(a.accessTokenEncrypted)
            : null;
        if (token) await newOAuthClient().revokeToken(token);
      } catch (e) {
        console.warn(
          "Google token revoke failed (continuing):",
          e instanceof Error ? e.message : e,
        );
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .delete(messages)
        .where(
          inArray(
            messages.chatId,
            tx
              .select({ id: chats.id })
              .from(chats)
              .where(eq(chats.userId, user.id)),
          ),
        );
      await tx.delete(chats).where(eq(chats.userId, user.id));
      await tx.delete(connectedApps).where(eq(connectedApps.userId, user.id));
      await tx.delete(refreshTokens).where(eq(refreshTokens.userId, user.id));
      await tx.delete(aiUsage).where(eq(aiUsage.userId, user.id));
      await tx.delete(emailOtps).where(eq(emailOtps.userId, user.id));
      await tx.delete(passwordResets).where(eq(passwordResets.userId, user.id));
      await tx.delete(knownDevices).where(eq(knownDevices.userId, user.id));
      await tx.delete(libraryItems).where(eq(libraryItems.userId, user.id));
      await tx.delete(authCodes).where(eq(authCodes.userId, user.id));
      await tx.delete(users).where(eq(users.id, user.id));
    });

    mail.accountDeleted(user);
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

router.get("/usage", async (req, res, next) => {
  try {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--)
      days.push(
        new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10),
      );

    const rows = await db
      .select()
      .from(aiUsage)
      .where(and(eq(aiUsage.userId, req.userId!), gte(aiUsage.day, days[0])));
    const byDay = new Map(rows.map((r) => [r.day, r]));

    return ok(res, {
      limit: DAILY_TOKEN_LIMIT,
      days: days.map((day) => ({
        day,
        input: byDay.get(day)?.inputTokens ?? 0,
        output: byDay.get(day)?.outputTokens ?? 0,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;

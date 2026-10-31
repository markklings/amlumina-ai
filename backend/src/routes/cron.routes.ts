import { createHash, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { and, eq, inArray, isNotNull, isNull, lt, lte, or } from "drizzle-orm";
import { db } from "../db/index.js";
import {
  authCodes,
  chatFiles,
  chats,
  emailOtps,
  flashCards,
  messages,
  passwordResets,
  refreshTokens,
  tasks,
  users,
} from "../db/schema.js";
import { mail } from "../services/mail.service.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
const sha = (s: string) => createHash("sha256").update(s).digest();
const MIN = 60_000;
const DAY = 86_400_000;

router.get("/daily", async (req, res, next) => {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret)
      return fail(res, 503, "CRON_DISABLED", "CRON_SECRET is not set");
    if (
      !timingSafeEqual(
        sha(req.headers.authorization ?? ""),
        sha(`Bearer ${secret}`),
      )
    ) {
      return fail(res, 401, "UNAUTHORIZED", "Invalid cron secret");
    }

    const now = new Date();

    // 1) cleanup. Revoked refresh tokens are kept for 7 days so reuse detection still works.
    await db
      .delete(refreshTokens)
      .where(
        or(
          lt(refreshTokens.expiresAt, now),
          and(
            isNotNull(refreshTokens.revokedAt),
            lt(refreshTokens.revokedAt, new Date(now.getTime() - 7 * DAY)),
          ),
        ),
      );
    const dayAgo = new Date(now.getTime() - DAY);
    await db.delete(passwordResets).where(lt(passwordResets.expiresAt, dayAgo));
    await db.delete(emailOtps).where(lt(emailOtps.expiresAt, dayAgo));
    await db.delete(authCodes).where(lt(authCodes.expiresAt, dayAgo));

    // 2) replies stuck on "streaming" after a crash or timeout
    const stale = new Date(now.getTime() - 10 * MIN);
    await db
      .update(messages)
      .set({ status: "error" })
      .where(
        and(eq(messages.status, "streaming"), lt(messages.createdAt, stale)),
      );
    await db
      .update(chats)
      .set({ streamingStartedAt: null })
      .where(
        and(
          isNotNull(chats.streamingStartedAt),
          lt(chats.streamingStartedAt, stale),
        ),
      );

    // 3) digest: opted-in users with a verified email only
    const today = now.toISOString().slice(0, 10);
    const recipients = await db
      .select()
      .from(users)
      .where(and(eq(users.emailDigest, true), isNotNull(users.emailVerifiedAt)))
      .limit(200);

    let sent = 0;
    for (const u of recipients) {
      try {
        const due = await db
          .select({ title: tasks.title, due: tasks.dueDate })
          .from(tasks)
          .where(
            and(
              eq(tasks.userId, u.id),
              eq(tasks.completed, false),
              isNotNull(tasks.dueDate),
              lte(tasks.dueDate, today),
            ),
          )
          .limit(10);
        const cards = await db
          .select({ id: flashCards.id })
          .from(flashCards)
          .where(and(eq(flashCards.userId, u.id), lte(flashCards.dueAt, now)))
          .limit(500);
        if (!due.length && !cards.length) continue;

        await mail.digestNow(u, {
          tasks: due.map((t) =>
            t.due && t.due < today ? `${t.title} (overdue)` : t.title,
          ),
          cards: cards.length,
        });
        sent++;
      } catch (e) {
        console.error(
          "Digest failed for a user:",
          e instanceof Error ? e.message : e,
        );
      }
    }

    // 4) task reminders (verified emails only; each task is reminded once)
    const dueRows = await db
      .select()
      .from(tasks)
      .where(
        and(
          eq(tasks.completed, false),
          isNotNull(tasks.dueDate),
          isNotNull(tasks.remindDays),
          isNull(tasks.remindedAt),
        ),
      )
      .limit(2000);
    const addDay = (k: string, n: number) =>
      new Date(Date.parse(`${k}T00:00:00Z`) + n * DAY)
        .toISOString()
        .slice(0, 10);
    const ready = dueRows.filter(
      (t) => addDay(t.dueDate!, -t.remindDays!) <= today,
    );

    const byUser = new Map<string, typeof ready>();
    for (const t of ready)
      byUser.set(t.userId, [...(byUser.get(t.userId) ?? []), t]);

    let remindersSent = 0;
    if (byUser.size) {
      const owners = await db
        .select()
        .from(users)
        .where(
          and(
            inArray(users.id, [...byUser.keys()].slice(0, 100)),
            isNotNull(users.emailVerifiedAt),
          ),
        );
      for (const u of owners) {
        const list = byUser.get(u.id)!;
        try {
          await mail.reminderNow(
            u,
            list.map((t) => ({
              title: t.title,
              due: t.dueDate!,
              overdue: t.dueDate! < today,
            })),
          );
          await db
            .update(tasks)
            .set({ remindedAt: now })
            .where(
              inArray(
                tasks.id,
                list.map((t) => t.id),
              ),
            );
          remindersSent++;
        } catch (e) {
          console.error(
            "Reminder failed for a user:",
            e instanceof Error ? e.message : e,
          );
        }
      }
    }

    // 5) attachments that were never sent
    await db
      .delete(chatFiles)
      .where(and(isNull(chatFiles.chatId), lt(chatFiles.createdAt, dayAgo)));

    return ok(res, {
      cleaned: true,
      digests_sent: sent,
      reminders_sent: remindersSent,
    });
  } catch (e) {
    next(e);
  }
});

export default router;

import { Router } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  aiUsage,
  chats,
  flashCards,
  messages,
  quizAttempts,
  quizzes,
  reviewLog,
  studySessions,
  tasks,
} from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const DAY = 86_400_000;
const addDays = (key: string, n: number) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

router.get("/", async (req, res, next) => {
  try {
    const q = z
      .object({ today: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) })
      .safeParse(req.query);
    if (!q.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid query",
        q.error.flatten().fieldErrors,
      );

    const uid = req.userId!;
    const today = q.data.today;
    const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
    const since = new Date(Date.now() - 7 * DAY);

    const [sessions, reviews, cards, attempts, taskRows, [msgs], usage] =
      await Promise.all([
        db
          .select({ day: studySessions.day, minutes: studySessions.minutes })
          .from(studySessions)
          .where(
            and(eq(studySessions.userId, uid), gte(studySessions.day, days[0])),
          ),
        db
          .select({ day: reviewLog.day, grade: reviewLog.grade })
          .from(reviewLog)
          .where(and(eq(reviewLog.userId, uid), gte(reviewLog.day, days[0]))),
        db
          .select({ dueAt: flashCards.dueAt })
          .from(flashCards)
          .where(eq(flashCards.userId, uid))
          .limit(10_000),
        db
          .select({
            title: quizzes.title,
            score: quizAttempts.score,
            total: quizAttempts.total,
            at: quizAttempts.createdAt,
          })
          .from(quizAttempts)
          .innerJoin(quizzes, eq(quizzes.id, quizAttempts.quizId))
          .where(eq(quizAttempts.userId, uid))
          .orderBy(desc(quizAttempts.createdAt))
          .limit(8),
        db
          .select({
            due: tasks.dueDate,
            completed: tasks.completed,
            completedAt: tasks.completedAt,
          })
          .from(tasks)
          .where(eq(tasks.userId, uid))
          .limit(1000),
        db
          .select({ n: sql<number>`count(*)` })
          .from(messages)
          .innerJoin(chats, eq(chats.id, messages.chatId))
          .where(
            and(
              eq(chats.userId, uid),
              eq(messages.role, "user"),
              gte(messages.createdAt, since),
            ),
          ),
        db
          .select({
            day: aiUsage.day,
            i: aiUsage.inputTokens,
            o: aiUsage.outputTokens,
          })
          .from(aiUsage)
          .where(and(eq(aiUsage.userId, uid), gte(aiUsage.day, days[0]))),
      ]);

    const by = <T extends { day: string }>(
      rows: T[],
      pick: (r: T) => number,
    ) => {
      const m = new Map<string, number>();
      for (const r of rows) m.set(r.day, (m.get(r.day) ?? 0) + pick(r));
      return m;
    };
    const focus = by(sessions, (r) => (r as { minutes: number }).minutes);
    const rev = by(reviews, () => 1);
    const tok = by(
      usage,
      (r) => (r as { i: number }).i + (r as { o: number }).o,
    );

    const now = Date.now();
    const soon = addDays(today, 7);
    const open = taskRows.filter((t) => !t.completed);
    const percents = attempts.map((a) =>
      Math.round((a.score / Math.max(1, a.total)) * 100),
    );

    return ok(res, {
      week: days.map((day) => ({
        day,
        focusMinutes: focus.get(day) ?? 0,
        reviews: rev.get(day) ?? 0,
        tokens: tok.get(day) ?? 0,
      })),
      focus: { weekMinutes: [...focus.values()].reduce((a, b) => a + b, 0) },
      cards: {
        total: cards.length,
        due: cards.filter((c) => c.dueAt.getTime() <= now).length,
        reviews7: reviews.length,
        goodRate: reviews.length
          ? Math.round(
              (reviews.filter((r) => r.grade >= 2).length / reviews.length) *
                100,
            )
          : null,
      },
      quizzes: {
        recent: attempts
          .slice(0, 5)
          .map((a, i) => ({
            title: a.title,
            percent: percents[i],
            at: a.at.toISOString(),
          })),
        average: percents.length
          ? Math.round(percents.reduce((a, b) => a + b, 0) / percents.length)
          : null,
      },
      tasks: {
        open: open.length,
        overdue: open.filter((t) => t.due && t.due < today).length,
        dueSoon: open.filter((t) => t.due && t.due >= today && t.due <= soon)
          .length,
        done7: taskRows.filter(
          (t) => t.completed && t.completedAt && t.completedAt >= since,
        ).length,
      },
      chat: {
        messages7: Number(msgs?.n ?? 0),
        tokens7: [...tok.values()].reduce((a, b) => a + b, 0),
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;

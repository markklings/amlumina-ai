import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, asc, desc, eq, lte } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import {
  flashCards,
  flashDecks,
  quizAttempts,
  quizzes,
  reviewLog,
  shares,
  studySessions,
} from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const DAY = 86_400_000;
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/* ───────────── FLASHCARDS ───────────── */
const getDeck = async (id: string, userId: string) =>
  (
    await db
      .select()
      .from(flashDecks)
      .where(and(eq(flashDecks.id, id), eq(flashDecks.userId, userId)))
      .limit(1)
  )[0];

router.get("/decks", async (req, res, next) => {
  try {
    const decks = await db
      .select()
      .from(flashDecks)
      .where(eq(flashDecks.userId, req.userId!))
      .orderBy(desc(flashDecks.createdAt))
      .limit(200);
    const cards = await db
      .select({ deckId: flashCards.deckId, dueAt: flashCards.dueAt })
      .from(flashCards)
      .where(eq(flashCards.userId, req.userId!))
      .limit(10_000);

    const now = Date.now();
    const stat = new Map<string, { total: number; due: number }>();
    for (const c of cards) {
      const s = stat.get(c.deckId) ?? { total: 0, due: 0 };
      s.total++;
      if (c.dueAt.getTime() <= now) s.due++;
      stat.set(c.deckId, s);
    }
    return ok(res, {
      decks: decks.map((d) => ({
        id: d.id,
        title: d.title,
        total: stat.get(d.id)?.total ?? 0,
        due: stat.get(d.id)?.due ?? 0,
        createdAt: d.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/decks/:id/review", async (req, res, next) => {
  try {
    const deck = await getDeck(String(req.params.id), req.userId!);
    if (!deck) return fail(res, 404, "DECK_NOT_FOUND", "Deck not found");

    const due = await db
      .select()
      .from(flashCards)
      .where(
        and(
          eq(flashCards.deckId, deck.id),
          eq(flashCards.userId, req.userId!),
          lte(flashCards.dueAt, new Date()),
        ),
      )
      .orderBy(asc(flashCards.dueAt))
      .limit(1000);

    return ok(res, {
      deck: { id: deck.id, title: deck.title },
      cards: due
        .slice(0, 30)
        .map((c) => ({ id: c.id, front: c.front, back: c.back })),
      dueTotal: due.length,
    });
  } catch (e) {
    next(e);
  }
});

/** Simplified SM-2. grade: 0 Again, 1 Hard, 2 Good, 3 Easy. */
function schedule(
  c: { ease: number; intervalDays: number; reps: number; lapses: number },
  grade: number,
) {
  let { ease, intervalDays, reps, lapses } = c;
  let dueAt: Date;

  if (grade === 0) {
    reps = 0;
    lapses += 1;
    ease = Math.max(130, ease - 20);
    intervalDays = 0;
    dueAt = new Date(Date.now() + 10 * 60_000);
  } else {
    ease = Math.min(
      350,
      Math.max(130, ease + (grade === 1 ? -15 : grade === 3 ? 15 : 0)),
    );
    if (reps === 0) intervalDays = grade === 3 ? 3 : 1;
    else if (reps === 1) intervalDays = grade === 1 ? 2 : grade === 2 ? 3 : 5;
    else {
      const factor = grade === 1 ? 0.8 : grade === 2 ? 1 : 1.3;
      intervalDays = Math.max(
        intervalDays + 1,
        Math.round(intervalDays * (ease / 100) * factor),
      );
    }
    intervalDays = Math.min(intervalDays, 365);
    reps += 1;
    dueAt = new Date(Date.now() + intervalDays * DAY);
  }
  return { ease, intervalDays, reps, lapses, dueAt };
}

router.post("/cards/:id/review", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        grade: z.number().int().min(0).max(3),
        day: z.string().regex(DAY_RE).optional(),
      })
      .safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const id = String(req.params.id);
    const [card] = await db
      .select()
      .from(flashCards)
      .where(and(eq(flashCards.id, id), eq(flashCards.userId, req.userId!)))
      .limit(1);
    if (!card) return fail(res, 404, "CARD_NOT_FOUND", "Card not found");

    const next_ = schedule(card, parsed.data.grade);
    await db.update(flashCards).set(next_).where(eq(flashCards.id, id));
    await db.insert(reviewLog).values({
      userId: req.userId!,
      grade: parsed.data.grade,
      day: parsed.data.day ?? new Date().toISOString().slice(0, 10),
    });
    return ok(res, { dueAt: next_.dueAt.toISOString() });
  } catch (e) {
    next(e);
  }
});

router.delete("/decks/:id", async (req, res, next) => {
  try {
    const deck = await getDeck(String(req.params.id), req.userId!);
    if (!deck) return fail(res, 404, "DECK_NOT_FOUND", "Deck not found");
    await db.transaction(async (tx) => {
      await tx
        .delete(shares)
        .where(and(eq(shares.kind, "deck"), eq(shares.targetId, deck.id)));
      await tx.delete(flashCards).where(eq(flashCards.deckId, deck.id));
      await tx.delete(flashDecks).where(eq(flashDecks.id, deck.id));
    });
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

/* ───────────── QUIZZES ───────────── */
const getQuiz = async (id: string, userId: string) =>
  (
    await db
      .select()
      .from(quizzes)
      .where(and(eq(quizzes.id, id), eq(quizzes.userId, userId)))
      .limit(1)
  )[0];

router.get("/quizzes", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(quizzes)
      .where(eq(quizzes.userId, req.userId!))
      .orderBy(desc(quizzes.createdAt))
      .limit(200);
    const att = await db
      .select({
        quizId: quizAttempts.quizId,
        score: quizAttempts.score,
        total: quizAttempts.total,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, req.userId!))
      .limit(5000);

    const stat = new Map<string, { attempts: number; best: number }>();
    for (const a of att) {
      const s = stat.get(a.quizId) ?? { attempts: 0, best: 0 };
      s.attempts++;
      s.best = Math.max(
        s.best,
        a.total ? Math.round((a.score / a.total) * 100) : 0,
      );
      stat.set(a.quizId, s);
    }
    return ok(res, {
      quizzes: rows.map((q) => ({
        id: q.id,
        title: q.title,
        questionCount: q.questions.length,
        attempts: stat.get(q.id)?.attempts ?? 0,
        best: stat.has(q.id) ? stat.get(q.id)!.best : null,
      })),
    });
  } catch (e) {
    next(e);
  }
});

// answers are NOT sent: grading happens on the server
router.get("/quizzes/:id", async (req, res, next) => {
  try {
    const q = await getQuiz(String(req.params.id), req.userId!);
    if (!q) return fail(res, 404, "QUIZ_NOT_FOUND", "Quiz not found");
    return ok(res, {
      id: q.id,
      title: q.title,
      questions: q.questions.map((x) => ({
        prompt: x.prompt,
        options: x.options,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.post("/quizzes/:id/attempt", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        answers: z.array(z.number().int().min(0).max(10).nullable()).max(50),
      })
      .safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const q = await getQuiz(String(req.params.id), req.userId!);
    if (!q) return fail(res, 404, "QUIZ_NOT_FOUND", "Quiz not found");

    const answers = q.questions.map((_, i) => parsed.data.answers[i] ?? null);
    const results = q.questions.map((x, i) => ({
      correct: answers[i] === x.answerIndex,
      answerIndex: x.answerIndex,
      explanation: x.explanation,
    }));
    const score = results.filter((r) => r.correct).length;

    await db.insert(quizAttempts).values({
      id: randomUUID(),
      userId: req.userId!,
      quizId: q.id,
      score,
      total: q.questions.length,
      answers,
    });
    return ok(res, { score, total: q.questions.length, results });
  } catch (e) {
    next(e);
  }
});

router.delete("/quizzes/:id", async (req, res, next) => {
  try {
    const q = await getQuiz(String(req.params.id), req.userId!);
    if (!q) return fail(res, 404, "QUIZ_NOT_FOUND", "Quiz not found");
    await db.transaction(async (tx) => {
      await tx.delete(quizAttempts).where(eq(quizAttempts.quizId, q.id));
      await tx.delete(quizzes).where(eq(quizzes.id, q.id));
    });
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

/* ───────────── FOCUS SESSIONS ───────────── */
const dayString = z.string().regex(DAY_RE);

router.post("/study-sessions", async (req, res, next) => {
  try {
    const parsed = z
      .object({
        minutes: z.number().int().min(1).max(240),
        label: z.string().trim().max(100).optional(),
        day: dayString,
      })
      .safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const { minutes, label, day } = parsed.data;
    const t = Date.parse(`${day}T00:00:00Z`);
    if (isNaN(t) || Math.abs(t - Date.now()) > 3 * DAY)
      return fail(res, 422, "VALIDATION_ERROR", "Invalid day");

    await db.insert(studySessions).values({
      id: randomUUID(),
      userId: req.userId!,
      minutes,
      label: label || null,
      day,
    });
    return ok(res, { logged: true }, 201);
  } catch (e) {
    next(e);
  }
});

const addDays = (key: string, n: number) =>
  new Date(Date.parse(`${key}T00:00:00Z`) + n * DAY).toISOString().slice(0, 10);

router.get("/study-stats", async (req, res, next) => {
  try {
    const q = z.object({ today: dayString }).safeParse(req.query);
    if (!q.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid query",
        q.error.flatten().fieldErrors,
      );
    const today = q.data.today;

    const rows = await db
      .select({ day: studySessions.day, minutes: studySessions.minutes })
      .from(studySessions)
      .where(eq(studySessions.userId, req.userId!))
      .orderBy(desc(studySessions.day))
      .limit(5000);

    const byDay = new Map<string, number>();
    let total = 0;
    for (const r of rows) {
      byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.minutes);
      total += r.minutes;
    }

    // streak: consecutive days with study, counting back from today (or yesterday if today is still empty)
    let streak = 0;
    let d = byDay.has(today) ? today : addDays(today, -1);
    while (byDay.has(d) && streak < 1000) {
      streak++;
      d = addDays(d, -1);
    }

    return ok(res, {
      todayMinutes: byDay.get(today) ?? 0,
      totalMinutes: total,
      streak,
      week: Array.from({ length: 7 }, (_, i) => {
        const day = addDays(today, i - 6);
        return { day, minutes: byDay.get(day) ?? 0 };
      }),
    });
  } catch (e) {
    next(e);
  }
});

export default router;

import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { EVENT_COLORS } from "../constants/colors.js";
import { db } from "../db/index.js";
import { calendarEvents } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/response.js";
import { buildIcs } from "../utils/ics.js";

const router = Router();
router.use(requireAuth);

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_SPAN_MS = 366 * 86_400_000;

const ser = (e: typeof calendarEvents.$inferSelect) => ({
  id: e.id,
  title: e.title,
  description: e.description ?? "",
  start: e.startAt,
  end: e.endAt,
  allDay: e.allDay,
  color: e.color,
  source: e.source,
});

const bodySchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.string().trim().max(2000).default(""),
  allDay: z.boolean().default(false),
  start: z.string().min(10).max(32),
  end: z.string().min(10).max(32),
  color: z.enum(EVENT_COLORS).default("zinc"),
});

function normalize(d: {
  allDay: boolean;
  start: string;
  end: string;
}): { start: string; end: string } | string {
  if (d.allDay) {
    if (!DATE.test(d.start) || !DATE.test(d.end))
      return "All-day events need dates (YYYY-MM-DD).";
    if (d.end < d.start) return "The end must not be before the start.";
    return { start: d.start, end: d.end };
  }
  const s = new Date(d.start);
  const e = new Date(d.end);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return "Invalid date or time.";
  if (e < s) return "The end must not be before the start.";
  if (e.getTime() - s.getTime() > MAX_SPAN_MS)
    return "An event cannot be longer than a year.";
  return { start: s.toISOString(), end: e.toISOString() };
}

const rangeQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

router.get("/events", async (req, res, next) => {
  try {
    const q = rangeQuery.safeParse(req.query);
    if (!q.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid query",
        q.error.flatten().fieldErrors,
      );

    const conds = [eq(calendarEvents.userId, req.userId!)];
    // starts before the range ends, ends after it starts (all-day rows compare by plain date)
    if (q.data.to)
      conds.push(lte(calendarEvents.startAt, q.data.to.toISOString()));
    if (q.data.from)
      conds.push(
        gte(calendarEvents.endAt, q.data.from.toISOString().slice(0, 10)),
      );

    const rows = await db
      .select()
      .from(calendarEvents)
      .where(and(...conds))
      .limit(1000);
    return ok(res, { events: rows.map(ser) });
  } catch (e) {
    next(e);
  }
});

router.post("/events", async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    const t = normalize(parsed.data);
    if (typeof t === "string") return fail(res, 422, "VALIDATION_ERROR", t);

    const id = randomUUID();
    await db.insert(calendarEvents).values({
      id,
      userId: req.userId!,
      title: parsed.data.title,
      description: parsed.data.description,
      allDay: parsed.data.allDay,
      color: parsed.data.color,
      startAt: t.start,
      endAt: t.end,
    });
    const [row] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id))
      .limit(1);
    return ok(res, { event: ser(row) }, 201);
  } catch (e) {
    next(e);
  }
});

router.put("/events/:id", async (req, res, next) => {
  try {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    const t = normalize(parsed.data);
    if (typeof t === "string") return fail(res, 422, "VALIDATION_ERROR", t);

    const id = String(req.params.id);
    const [r] = await db
      .update(calendarEvents)
      .set({
        title: parsed.data.title,
        description: parsed.data.description,
        allDay: parsed.data.allDay,
        color: parsed.data.color,
        startAt: t.start,
        endAt: t.end,
      })
      .where(
        and(eq(calendarEvents.id, id), eq(calendarEvents.userId, req.userId!)),
      );
    if (r.affectedRows === 0)
      return fail(res, 404, "EVENT_NOT_FOUND", "Event not found");

    const [row] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id))
      .limit(1);
    return ok(res, { event: ser(row) });
  } catch (e) {
    next(e);
  }
});

router.delete("/events/:id", async (req, res, next) => {
  try {
    const [r] = await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.id, String(req.params.id)),
          eq(calendarEvents.userId, req.userId!),
        ),
      );
    if (r.affectedRows === 0)
      return fail(res, 404, "EVENT_NOT_FOUND", "Event not found");
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

router.get("/export", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, req.userId!))
      .limit(5000);
    res.set({
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="calendar.ics"',
    });
    res.send(buildIcs(rows, "Amlumina AI"));
  } catch (e) {
    next(e);
  }
});

export default router;

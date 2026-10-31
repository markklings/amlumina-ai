import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const MAX_TASKS = 500;
const due = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .nullable();

const ser = (t: typeof tasks.$inferSelect) => ({
  id: t.id,
  title: t.title,
  notes: t.notes,
  due: t.dueDate,
  remindDays: t.remindDays,
  completed: t.completed,
});

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, req.userId!))
      .orderBy(desc(tasks.createdAt))
      .limit(MAX_TASKS);
    return ok(res, { tasks: rows.map(ser) });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(255),
  notes: z.string().trim().max(2000).nullable().optional(),
  due: due.optional(),
  remindDays: z.number().int().min(0).max(7).nullable().optional(),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const mine = await db
      .select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.userId, req.userId!))
      .limit(MAX_TASKS);
    if (mine.length >= MAX_TASKS)
      return fail(
        res,
        409,
        "LIMIT_REACHED",
        "Too many tasks. Delete some first.",
      );

    const id = randomUUID();
    await db.insert(tasks).values({
      id,
      userId: req.userId!,
      title: parsed.data.title,
      notes: parsed.data.notes || null,
      dueDate: parsed.data.due ?? null,
      remindDays: parsed.data.due ? (parsed.data.remindDays ?? null) : null,
    });
    const [row] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return ok(res, { task: ser(row) }, 201);
  } catch (e) {
    next(e);
  }
});

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    notes: z.string().trim().max(2000).nullable().optional(),
    due: due.optional(),
    remindDays: z.number().int().min(0).max(7).nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const d = parsed.data;
    const id = String(req.params.id);
    const [r] = await db
      .update(tasks)
      .set({
        ...(d.title !== undefined && { title: d.title }),
        ...(d.notes !== undefined && { notes: d.notes || null }),
        ...(d.due !== undefined && { dueDate: d.due }),
        ...(d.remindDays !== undefined && {
          remindDays: d.remindDays,
          remindedAt: null,
        }),
        ...(d.due !== undefined && { remindedAt: null }),
        ...(d.completed !== undefined && {
          completed: d.completed,
          completedAt: d.completed ? new Date() : null,
        }),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, req.userId!)));
    if (r.affectedRows === 0)
      return fail(res, 404, "TASK_NOT_FOUND", "Task not found");

    const [row] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id))
      .limit(1);
    return ok(res, { task: ser(row) });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const [r] = await db
      .delete(tasks)
      .where(
        and(eq(tasks.id, String(req.params.id)), eq(tasks.userId, req.userId!)),
      );
    if (r.affectedRows === 0)
      return fail(res, 404, "TASK_NOT_FOUND", "Task not found");
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;

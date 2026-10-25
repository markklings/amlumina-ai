import { Router } from "express";
import { google } from "googleapis";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { connectedApps } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { ok, fail } from "../utils/response";
import { respondGoogleError } from "../utils/googleErrors";
import { getGoogleAuth } from "../services/google-auth.service";

const CALENDAR_APP = 5;
const TASKS_APP = 6;
const TASKLIST = "@default";
const DAY = 86_400_000;

const router = Router();
router.use(requireAuth);

const overviewQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  account: z.string().trim().max(255).optional(),
});

router.get("/overview", async (req, res, next) => {
  try {
    const q = overviewQuery.safeParse(req.query);
    if (!q.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid query",
        q.error.flatten().fieldErrors,
      );

    const from = q.data.from ?? new Date();
    const to = q.data.to ?? new Date(from.getTime() + 14 * DAY);
    if (to <= from || to.getTime() - from.getTime() > 62 * DAY) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "`to` must be after `from`, within 62 days",
      );
    }

    const rows = await db
      .select({ apps: connectedApps.apps })
      .from(connectedApps)
      .where(eq(connectedApps.userId, req.userId!));
    const calendarConnected = rows.some((r) => r.apps.includes(CALENDAR_APP));
    const tasksConnected = rows.some((r) => r.apps.includes(TASKS_APP));

    const [events, items] = await Promise.all([
      calendarConnected
        ? fetchEvents(req.userId!, from, to, q.data.account)
        : [],
      tasksConnected ? fetchTasks(req.userId!, q.data.account) : [],
    ]);

    return ok(res, {
      calendar: { connected: calendarConnected, events },
      tasks: { connected: tasksConnected, items },
    });
  } catch (e) {
    if (!respondGoogleError(res, e)) next(e);
  }
});

async function fetchEvents(
  userId: string,
  from: Date,
  to: Date,
  account?: string,
) {
  const { auth } = await getGoogleAuth(userId, CALENDAR_APP, account);
  const calendar = google.calendar({ version: "v3", auth });
  const r = await calendar.events.list({
    calendarId: "primary",
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 100,
  });

  return (r.data.items ?? [])
    .filter((e) => e.id && (e.start?.dateTime || e.start?.date))
    .map((e) => ({
      id: e.id!,
      title: e.summary ?? "(No title)",
      start: (e.start?.dateTime ?? e.start?.date)!,
      end: (e.end?.dateTime ??
        e.end?.date ??
        e.start?.dateTime ??
        e.start?.date)!,
      allDay: !e.start?.dateTime,
      location: e.location ?? null,
      link: e.htmlLink ?? "",
      createdByLumi: e.extendedProperties?.private?.source === "lumi",
    }));
}

async function fetchTasks(userId: string, account?: string) {
  const { auth } = await getGoogleAuth(userId, TASKS_APP, account);
  const tasks = google.tasks({ version: "v1", auth });
  const r = await tasks.tasks.list({
    tasklist: TASKLIST,
    showCompleted: true,
    showHidden: true,
    maxResults: 100,
  });

  const cutoff = Date.now() - 14 * DAY;
  return (r.data.items ?? [])
    .filter(
      (t) =>
        t.id &&
        (t.status !== "completed" ||
          !t.completed ||
          new Date(t.completed).getTime() >= cutoff),
    )
    .map((t) => ({
      id: t.id!,
      title: t.title || "(Untitled)",
      notes: t.notes ?? null,
      due: t.due ? t.due.slice(0, 10) : null,
      completed: t.status === "completed",
    }));
}

const toggleSchema = z.object({ completed: z.boolean() });

router.patch("/tasks/:id", async (req, res, next) => {
  try {
    const parsed = toggleSchema.safeParse(req.body);
    const id = String(req.params.id);
    if (!parsed.success || id.length > 200) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.success ? undefined : parsed.error.flatten().fieldErrors,
      );
    }

    const { auth } = await getGoogleAuth(req.userId!, TASKS_APP);
    const tasks = google.tasks({ version: "v1", auth });
    const r = await tasks.tasks.patch({
      tasklist: TASKLIST,
      task: id,
      requestBody: parsed.data.completed
        ? { status: "completed" }
        : { status: "needsAction", completed: null },
    });
    return ok(res, { id, completed: r.data.status === "completed" });
  } catch (e) {
    if (!respondGoogleError(res, e)) next(e);
  }
});

export default router;

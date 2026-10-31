import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import { and, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { aiUsage, chats, documents, messages, users } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { isAdmin } from "../utils/admin.js";
import { fail, ok } from "../utils/response.js";

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const [u] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!u || !isAdmin(u))
      return fail(res, 404, "NOT_FOUND", "Route not found");
    next();
  } catch (e) {
    next(e);
  }
}

const router = Router();
router.use(requireAuth, requireAdmin);

const DAY = 86_400_000;
const n = sql<number>`count(*)`;
const dayOf = (d: number) => new Date(d).toISOString().slice(0, 10);

router.get("/stats", async (_req, res, next) => {
  try {
    const now = Date.now();
    const since14 = new Date(now - 14 * DAY);
    const since7 = new Date(now - 7 * DAY);
    const days = Array.from({ length: 14 }, (_, i) =>
      dayOf(now - (13 - i) * DAY),
    );

    const signupDayAlias = sql`DATE_FORMAT(${users.createdAt}, '%Y-%m-%d')`.as("day");
    const sumTokensExpr = sql`sum(${aiUsage.inputTokens} + ${aiUsage.outputTokens})`;

    const [
      [u],
      [v],
      [c],
      [m],
      [d],
      [errs],
      signups,
      tokens,
      models,
      top,
      recent,
    ] = await Promise.all([
      db.select({ n }).from(users),
      db.select({ n }).from(users).where(isNotNull(users.emailVerifiedAt)),
      db.select({ n }).from(chats),
      db.select({ n }).from(messages),
      db.select({ n }).from(documents),
      db
        .select({ n })
        .from(messages)
        .where(
          and(eq(messages.status, "error"), gte(messages.createdAt, since7)),
        ),
      db
        .select({ day: signupDayAlias, n })
        .from(users)
        .where(gte(users.createdAt, since14))
        .groupBy(sql`day`),
      db
        .select({
          day: aiUsage.day,
          t: sumTokensExpr,
        })
        .from(aiUsage)
        .where(gte(aiUsage.day, days[0]))
        .groupBy(aiUsage.day),
      db
        .select({ model: messages.model, n })
        .from(messages)
        .where(
          and(eq(messages.role, "assistant"), gte(messages.createdAt, since7)),
        )
        .groupBy(messages.model),
      db
        .select({
          email: users.email,
          name: users.fullName,
          t: sumTokensExpr,
        })
        .from(aiUsage)
        .innerJoin(users, eq(users.id, aiUsage.userId))
        .where(eq(aiUsage.day, days[13]))
        .groupBy(users.id, users.email, users.fullName)
        .orderBy(desc(sumTokensExpr))
        .limit(10),
      db
        .select({
          email: users.email,
          name: users.fullName,
          provider: users.authProvider,
          verified: users.emailVerifiedAt,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt))
        .limit(25),
    ]);

    const sMap = new Map(signups.map((r) => [r.day, Number(r.n)]));
    const tMap = new Map(tokens.map((r) => [r.day, Number(r.t)]));

    return ok(res, {
      totals: {
        users: Number(u.n),
        verified: Number(v.n),
        chats: Number(c.n),
        messages: Number(m.n),
        documents: Number(d.n),
        errors7: Number(errs.n),
      },
      daily: days.map((day) => ({
        day,
        signups: sMap.get(day) ?? 0,
        tokens: tMap.get(day) ?? 0,
      })),
      models: models.map((r) => ({
        model: r.model ?? "unknown",
        count: Number(r.n),
      })),
      topToday: top.map((r) => ({
        email: r.email,
        name: r.name,
        tokens: Number(r.t),
      })),
      recentUsers: recent.map((r) => ({
        email: r.email,
        name: r.name,
        provider: r.provider,
        verified: !!r.verified,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;

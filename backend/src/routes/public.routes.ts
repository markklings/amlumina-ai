import { Router } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { documents, flashCards, flashDecks, shares } from "../db/schema.js";
import { limiter } from "../middleware/rateLimit.js";
import { docHtml } from "../utils/docFormat.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(limiter(60, 60_000, "ip", "public"));

const NOT_FOUND = "This link is invalid or sharing was turned off.";

async function target(kind: "doc" | "deck", token: string) {
  if (token.length > 64) return null;
  const [s] = await db
    .select()
    .from(shares)
    .where(and(eq(shares.token, token), eq(shares.kind, kind)))
    .limit(1);
  return s ?? null;
}

router.get("/doc/:token", async (req, res, next) => {
  try {
    const s = await target("doc", String(req.params.token));
    const [d] = s
      ? await db
          .select()
          .from(documents)
          .where(eq(documents.id, s.targetId))
          .limit(1)
      : [];
    if (!d) return fail(res, 404, "NOT_FOUND", NOT_FOUND);
    return ok(res, {
      title: d.title,
      html: docHtml(d.content, d.format),
      updatedAt: d.updatedAt.toISOString(),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/deck/:token", async (req, res, next) => {
  try {
    const s = await target("deck", String(req.params.token));
    const [deck] = s
      ? await db
          .select()
          .from(flashDecks)
          .where(eq(flashDecks.id, s.targetId))
          .limit(1)
      : [];
    if (!deck) return fail(res, 404, "NOT_FOUND", NOT_FOUND);
    const cards = await db
      .select({ front: flashCards.front, back: flashCards.back })
      .from(flashCards)
      .where(eq(flashCards.deckId, deck.id))
      .orderBy(asc(flashCards.createdAt))
      .limit(200);
    return ok(res, { title: deck.title, cards });
  } catch (e) {
    next(e);
  }
});

export default router;

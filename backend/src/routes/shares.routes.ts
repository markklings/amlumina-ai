import { randomBytes } from "node:crypto";
import { Router } from "express";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { documents, flashDecks, shares } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const kindSchema = z.enum(["doc", "deck"]);

async function owns(kind: "doc" | "deck", id: string, userId: string) {
  const [row] =
    kind === "doc"
      ? await db
          .select({ id: documents.id })
          .from(documents)
          .where(and(eq(documents.id, id), eq(documents.userId, userId)))
          .limit(1)
      : await db
          .select({ id: flashDecks.id })
          .from(flashDecks)
          .where(and(eq(flashDecks.id, id), eq(flashDecks.userId, userId)))
          .limit(1);
  return !!row;
}

const find = async (kind: "doc" | "deck", id: string, userId: string) =>
  (
    await db
      .select()
      .from(shares)
      .where(
        and(
          eq(shares.userId, userId),
          eq(shares.kind, kind),
          eq(shares.targetId, id),
        ),
      )
      .limit(1)
  )[0];

router.use("/:kind/:id", async (req, res, next) => {
  const kind = kindSchema.safeParse(req.params.kind);
  if (!kind.success) return fail(res, 404, "NOT_FOUND", "Not found");
  if (
    !(await owns(kind.data, String(req.params.id), req.userId!).catch(
      () => false,
    ))
  )
    return fail(res, 404, "NOT_FOUND", "Not found");
  next();
});

router.get("/:kind/:id", async (req, res, next) => {
  try {
    const s = await find(
      req.params.kind as "doc" | "deck",
      String(req.params.id),
      req.userId!,
    );
    return ok(res, { shared: !!s, token: s?.token ?? null });
  } catch (e) {
    next(e);
  }
});

router.post("/:kind/:id", async (req, res, next) => {
  try {
    const kind = req.params.kind as "doc" | "deck";
    const id = String(req.params.id);
    let s = await find(kind, id, req.userId!);
    if (!s) {
      await db
        .insert(shares)
        .values({
          userId: req.userId!,
          kind,
          targetId: id,
          token: randomBytes(24).toString("base64url"),
        });
      s = await find(kind, id, req.userId!);
    }
    return ok(res, { shared: true, token: s!.token });
  } catch (e) {
    next(e);
  }
});

router.delete("/:kind/:id", async (req, res, next) => {
  try {
    await db
      .delete(shares)
      .where(
        and(
          eq(shares.userId, req.userId!),
          eq(shares.kind, req.params.kind as "doc" | "deck"),
          eq(shares.targetId, String(req.params.id)),
        ),
      );
    return ok(res, { shared: false, token: null });
  } catch (e) {
    next(e);
  }
});

export default router;

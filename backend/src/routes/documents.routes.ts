import { randomUUID } from "node:crypto";
import { Router } from "express";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { documents, shares } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { docHtml, docText, sanitizeDoc } from "../utils/docFormat.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const MAX_CHARS = 400_000;
const MAX_DOCS = 500;

const full = (d: typeof documents.$inferSelect) => ({
  id: d.id,
  title: d.title,
  html: docHtml(d.content, d.format),
  source: d.source,
  createdAt: d.createdAt.toISOString(),
  updatedAt: d.updatedAt.toISOString(),
});

const getOwned = async (id: string, userId: string) =>
  (
    await db
      .select()
      .from(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, userId)))
      .limit(1)
  )[0];

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select({
        id: documents.id,
        title: documents.title,
        source: documents.source,
        format: documents.format,
        createdAt: documents.createdAt,
        updatedAt: documents.updatedAt,
        head: sql<string>`substring(${documents.content}, 1, 1500)`,
      })
      .from(documents)
      .where(eq(documents.userId, req.userId!))
      .orderBy(desc(documents.updatedAt))
      .limit(MAX_DOCS);

    return ok(res, {
      documents: rows.map((r) => ({
        id: r.id,
        title: r.title,
        source: r.source,
        excerpt: docText(r.head ?? "", r.format)
          .replace(/[#*`>|_~[\]]/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 140),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      })),
    });
  } catch (e) {
    next(e);
  }
});

const createSchema = z.object({
  title: z.string().trim().min(1).max(255).default("Untitled document"),
  html: z.string().max(MAX_CHARS).default(""),
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body ?? {});
    if (!parsed.success)
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );

    const [{ n }] = await db
      .select({ n: sql<number>`count(*)` })
      .from(documents)
      .where(eq(documents.userId, req.userId!));
    if (Number(n) >= MAX_DOCS)
      return fail(
        res,
        409,
        "LIMIT_REACHED",
        `You can keep up to ${MAX_DOCS} documents. Delete some first.`,
      );

    const id = randomUUID();
    await db.insert(documents).values({
      id,
      userId: req.userId!,
      title: parsed.data.title,
      content: sanitizeDoc(parsed.data.html),
      format: "html",
    });
    return ok(res, { document: full((await getOwned(id, req.userId!))!) }, 201);
  } catch (e) {
    next(e);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const d = await getOwned(String(req.params.id), req.userId!);
    if (!d) return fail(res, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    return ok(res, { document: full(d) });
  } catch (e) {
    next(e);
  }
});

const patchSchema = z
  .object({
    title: z.string().trim().min(1).max(255).optional(),
    html: z.string().max(MAX_CHARS).optional(),
  })
  .refine(
    (d) => d.title !== undefined || d.html !== undefined,
    "Nothing to update",
  );

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

    const id = String(req.params.id);
    const { title, html } = parsed.data;
    const [r] = await db
      .update(documents)
      .set({
        ...(title !== undefined && { title }),
        ...(html !== undefined && {
          content: sanitizeDoc(html),
          format: "html" as const,
        }),
      })
      .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)));
    if (r.affectedRows === 0)
      return fail(res, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    return ok(res, { document: full((await getOwned(id, req.userId!))!) });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const [r] = await db
      .delete(documents)
      .where(and(eq(documents.id, id), eq(documents.userId, req.userId!)));
    if (r.affectedRows === 0)
      return fail(res, 404, "DOCUMENT_NOT_FOUND", "Document not found");
    await db
      .delete(shares)
      .where(and(eq(shares.kind, "doc"), eq(shares.targetId, id)));
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;

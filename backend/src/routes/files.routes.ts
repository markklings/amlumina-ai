/// <reference path="../types/pdf-parse.d.ts" />
import { Router } from "express";
import multer from "multer";
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import { and, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../db/index.js";
import { chatFiles } from "../db/schema.js";
import { requireAuth } from "../middleware/auth.js";
import { limiter } from "../middleware/rateLimit.js";
import { fail, ok } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

const MAX_TEXT = 60_000;
const MAX_FILES = 50;
const TEXT_EXT = [".txt", ".md", ".csv", ".tsv", ".json"];

// Vercel rejects request bodies over about 4.5 MB, so 4 MB is the practical ceiling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024, files: 1 },
});
const uploadLimiter = limiter(10, 10 * 60_000, "user", "upload");

router.post(
  "/",
  uploadLimiter,
  (req, res, next) =>
    upload.single("file")(req, res, (err: unknown) => {
      if (!err) return next();
      const tooBig = (err as { code?: string }).code === "LIMIT_FILE_SIZE";
      return fail(
        res,
        tooBig ? 413 : 400,
        "UPLOAD_FAILED",
        tooBig ? "The file is larger than 4 MB." : "Could not read the upload.",
      );
    }),
  async (req, res, next) => {
    try {
      const file = req.file;
      if (!file) return fail(res, 422, "VALIDATION_ERROR", "Attach a file.");

      const name = Buffer.from(file.originalname, "latin1")
        .toString("utf8")
        .slice(0, 255); // multer decodes names as latin1
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      const isPdf = ext === ".pdf" || file.mimetype === "application/pdf";
      const isText =
        TEXT_EXT.includes(ext) || file.mimetype.startsWith("text/");
      if (!isPdf && !isText)
        return fail(
          res,
          422,
          "UNSUPPORTED_FILE",
          "Only text (.txt, .md, .csv) and PDF files are supported.",
        );

      const mine = await db
        .select({ id: chatFiles.id })
        .from(chatFiles)
        .where(eq(chatFiles.userId, req.userId!))
        .limit(MAX_FILES);
      if (mine.length >= MAX_FILES)
        return fail(
          res,
          409,
          "LIMIT_REACHED",
          "Too many files. Delete a chat or remove attachments first.",
        );

      let text: string;
      if (isPdf) {
        if (file.buffer.subarray(0, 5).toString() !== "%PDF-")
          return fail(res, 422, "UNSUPPORTED_FILE", "This is not a valid PDF.");
        try {
          text = (await pdfParse(file.buffer)).text;
        } catch {
          return fail(res, 422, "UNREADABLE_FILE", "Could not read this PDF.");
        }
      } else {
        text = file.buffer.toString("utf8");
        if (text.includes("\u0000"))
          return fail(
            res,
            422,
            "UNSUPPORTED_FILE",
            "This does not look like a text file.",
          );
      }

      text = text
        .replace(/\r/g, "")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      if (!text)
        return fail(
          res,
          422,
          "UNREADABLE_FILE",
          "No readable text found. Scanned PDFs are not supported.",
        );

      const truncated = text.length > MAX_TEXT;
      const kept = text.slice(0, MAX_TEXT);
      const id = randomUUID();
      await db.insert(chatFiles).values({
        id,
        userId: req.userId!,
        name,
        text: kept,
        chars: kept.length,
      });
      return ok(res, { id, name, chars: kept.length, truncated }, 201);
    } catch (e) {
      next(e);
    }
  },
);

// only files that were never sent can be removed here
router.delete("/:id", async (req, res, next) => {
  try {
    await db
      .delete(chatFiles)
      .where(
        and(
          eq(chatFiles.id, String(req.params.id)),
          eq(chatFiles.userId, req.userId!),
          isNull(chatFiles.chatId),
        ),
      );
    return ok(res, { deleted: true });
  } catch (e) {
    next(e);
  }
});

export default router;

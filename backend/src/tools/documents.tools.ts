import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { and, desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { documents } from "../db/schema.js";
import { runTool, ToolError, type ToolDef } from "./_shared.js";
import { docText, mdToHtml, sanitizeDoc } from "../utils/docFormat.js";

const MAX_CHARS = 100_000;
const owned = (id: string, userId: string) =>
  and(eq(documents.id, id), eq(documents.userId, userId));

export const documentTools: ToolDef[] = [
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ title, content }) =>
          runTool(async () => {
            const id = randomUUID();
            await db.insert(documents).values({
              id,
              userId: ctx.userId,
              title: title.slice(0, 255),
              content: content.slice(0, MAX_CHARS),
              source: "lumi",
            });
            return {
              document_id: id,
              title,
              link: `/documents/${id}`,
              note: "Saved in the student's Library, where they can edit and export it.",
            };
          }),
        {
          name: "documents_create",
          description:
            "Create a document (reviewer, summary, notes) in the student's Library. Content is full Markdown: headings, bold, lists, tables and code blocks. Put the whole document in one call.",
          schema: z.object({
            title: z.string(),
            content: z.string().describe("The complete document in Markdown"),
          }),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async () =>
          runTool(async () => {
            const rows = await db
              .select({
                id: documents.id,
                title: documents.title,
                updated: documents.updatedAt,
              })
              .from(documents)
              .where(eq(documents.userId, ctx.userId))
              .orderBy(desc(documents.updatedAt))
              .limit(20);
            return {
              documents: rows.map((r) => ({
                id: r.id,
                title: r.title,
                updated: r.updated.toISOString(),
              })),
            };
          }),
        {
          name: "documents_list",
          description: "List the student's 20 most recently edited documents.",
          schema: z.object({}),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ document_id }) =>
          runTool(async () => {
            const [d] = await db
              .select()
              .from(documents)
              .where(owned(document_id, ctx.userId))
              .limit(1);
            if (!d) throw new ToolError("Document not found.");
            return {
              id: d.id,
              title: d.title,
              content: docText(d.content, d.format).slice(0, 12000),
              link: `/documents/${d.id}`,
            };
          }),
        {
          name: "documents_read",
          description:
            "Read a document (first ~12000 characters). Get document_id from documents_list.",
          schema: z.object({ document_id: z.string() }),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ document_id, text }) =>
          runTool(async () => {
            const [d] = await db
              .select()
              .from(documents)
              .where(owned(document_id, ctx.userId))
              .limit(1);
            if (!d) throw new ToolError("Document not found.");
            const addition =
              d.format === "html" ? sanitizeDoc(mdToHtml(text)) : `\n\n${text}`;
            if (d.content.length + addition.length > MAX_CHARS)
              throw new ToolError("The document would be too long.");
            await db
              .update(documents)
              .set({ content: d.content + addition })
              .where(eq(documents.id, d.id));
            return { appended: true, link: `/documents/${d.id}` };
          }),
        {
          name: "documents_append",
          description:
            "Append Markdown text to the end of an existing document.",
          schema: z.object({ document_id: z.string(), text: z.string() }),
        },
      ),
  },
];

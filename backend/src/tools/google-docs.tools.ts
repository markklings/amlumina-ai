import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service.js";
import { accountField, runTool, ToolError, type ToolDef } from "./_shared.js";
import { recordLibraryItem } from "../services/library.service.js";
import { Readable } from "node:stream";
import { marked } from "marked";

const APP_ID = 3;
const DRIVE_APP_ID = 2;
const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return { docs: google.docs({ version: "v1", auth }), accountEmail };
}

function markdownToHtml(md: string): string {
  const body = (marked.parse(md, { gfm: true, async: false }) as string)
    .replace(
      /<table>/g,
      '<table border="1" cellpadding="6" cellspacing="0" style="border-collapse:collapse">',
    )
    .replace(
      /<pre>/g,
      '<pre style="font-family:Consolas,monospace;background:#f4f4f5">',
    );
  return `<html><head><meta charset="utf-8"></head><body>${body}</body></html>`;
}

function buildRequests(md: string) {
  let text = "";
  const styles: any[] = [];
  const bullets: any[] = [];
  for (const raw of md.split("\n")) {
    let line = raw;
    let heading = 0;
    let bullet = false;
    const h = /^(#{1,3})\s+(.*)$/.exec(line);
    if (h) {
      heading = h[1].length;
      line = h[2];
    } else if (/^\s*[-*]\s+/.test(line)) {
      bullet = true;
      line = line.replace(/^\s*[-*]\s+/, "");
    }
    line = line.replace(/\*\*(.*?)\*\*/g, "$1");
    const startIndex = text.length + 1;
    text += line + "\n";
    const range = { startIndex, endIndex: startIndex + line.length + 1 };
    if (heading) {
      styles.push({
        updateParagraphStyle: {
          range,
          paragraphStyle: { namedStyleType: `HEADING_${heading}` },
          fields: "namedStyleType",
        },
      });
    }
    if (bullet)
      bullets.push({
        createParagraphBullets: {
          range,
          bulletPreset: "BULLET_DISC_CIRCLE_SQUARE",
        },
      });
  }
  return [
    { insertText: { location: { index: 1 }, text } },
    ...styles,
    ...bullets,
  ];
}

const readText = (doc: any): string =>
  (doc.body?.content ?? [])
    .flatMap((b: any) => b.paragraph?.elements ?? [])
    .map((e: any) => e.textRun?.content ?? "")
    .join("");

export const docsTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        //         async ({ title, content, folder_id, account }) =>
        //           runTool(async () => {
        //             const { docs, accountEmail } = await api(ctx.userId, account);
        //             const created = await docs.documents.create({
        //               requestBody: { title },
        //             });
        //             const documentId = created.data.documentId!;
        //             await docs.documents.batchUpdate({
        //               documentId,
        //               requestBody: { requests: buildRequests(content) },
        //             });
        //
        //             let note: string | undefined;
        //             if (folder_id) {
        //               try {
        //                 const { auth } = await getGoogleAuth(
        //                   ctx.userId,
        //                   DRIVE_APP_ID,
        //                   accountEmail,
        //                 );
        //                 await google.drive({ version: "v3", auth }).files.update({
        //                   fileId: documentId,
        //                   addParents: folder_id,
        //                   removeParents: "root",
        //                   fields: "id",
        //                 });
        //               } catch {
        //                 note =
        //                   "Document created in Drive root; moving it to the folder failed.";
        //               }
        //             }
        //
        //             const link = `https://docs.google.com/document/d/${documentId}/edit`;
        //             await recordLibraryItem({
        //               userId: ctx.userId,
        //               kind: "doc",
        //               title,
        //               fileId: documentId,
        //               account: accountEmail,
        //               link,
        //             });
        //             return {
        //               account: accountEmail,
        //               document_id: documentId,
        //               link,
        //               note,
        //             };
        //           })
        // - Old Tool
        async ({ title, content, folder_id, account }) =>
          runTool(async () => {
            const { auth, accountEmail, scopes } = await getGoogleAuth(
              ctx.userId,
              APP_ID,
              account,
            );
            let documentId: string;
            let note: string | undefined;

            if (scopes.includes(DRIVE_FILE_SCOPE)) {
              // clean path: Google converts the HTML into a properly formatted Doc
              const drive = google.drive({ version: "v3", auth });
              const r = await drive.files.create({
                requestBody: {
                  name: title,
                  mimeType: "application/vnd.google-apps.document",
                  parents: folder_id ? [folder_id] : undefined,
                },
                media: {
                  mimeType: "text/html",
                  body: Readable.from([markdownToHtml(content)]),
                },
                fields: "id",
              });
              documentId = r.data.id!;
            } else {
              // fallback: basic formatting only (headings and bullets). Reconnect Google Docs to enable full formatting.
              const docs = google.docs({ version: "v1", auth });
              const created = await docs.documents.create({
                requestBody: { title },
              });
              documentId = created.data.documentId!;
              await docs.documents.batchUpdate({
                documentId,
                requestBody: { requests: buildRequests(content) },
              });
              note =
                "Basic formatting used. The student can reconnect Google Docs in Settings for full formatting.";
            }

            const link = `https://docs.google.com/document/d/${documentId}/edit`;
            await recordLibraryItem({
              userId: ctx.userId,
              kind: "doc",
              title,
              fileId: documentId,
              account: accountEmail,
              link,
            });
            return {
              account: accountEmail,
              document_id: documentId,
              link,
              note,
            };
          }),
        {
          name: "google_docs_create_document",
          description:
            "Create a Google Doc such as a reviewer, summary or notes. Content supports '# ', '## ', '### ' headings and '- ' bullets.",
          schema: z.object({
            title: z.string(),
            content: z.string().describe("Document body in light markdown"),
            folder_id: z
              .string()
              .optional()
              .describe(
                "Optional Drive folder ID (requires Google Drive connected)",
              ),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ document_id, account }) =>
          runTool(async () => {
            const { docs, accountEmail } = await api(ctx.userId, account);
            const r = await docs.documents.get({ documentId: document_id });
            return {
              account: accountEmail,
              title: r.data.title,
              text: readText(r.data).slice(0, 5000),
            };
          }),
        {
          name: "google_docs_read_document",
          description:
            "Read the text of a Google Doc (first ~5000 characters).",
          schema: z.object({ document_id: z.string(), account: accountField }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ document_id, text, account }) =>
          runTool(async () => {
            if (!text.trim()) throw new ToolError("Nothing to append.");
            const { docs, accountEmail } = await api(ctx.userId, account);
            await docs.documents.batchUpdate({
              documentId: document_id,
              requestBody: {
                requests: [
                  {
                    insertText: { endOfSegmentLocation: {}, text: "\n" + text },
                  },
                ],
              },
            });
            return {
              account: accountEmail,
              appended: true,
              link: `https://docs.google.com/document/d/${document_id}/edit`,
            };
          }),
        {
          name: "google_docs_append_text",
          description:
            "Append plain text to the end of an existing Google Doc.",
          schema: z.object({
            document_id: z.string(),
            text: z.string(),
            account: accountField,
          }),
        },
      ),
  },
];

import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service";
import { accountField, runTool, type ToolDef } from "./_shared";
import { recordLibraryItem } from "../services/library.service";

const APP_ID = 2;

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return { drive: google.drive({ version: "v3", auth }), accountEmail };
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
const MIME: Record<string, string> = {
  folder: "application/vnd.google-apps.folder",
  document: "application/vnd.google-apps.document",
  spreadsheet: "application/vnd.google-apps.spreadsheet",
  pdf: "application/pdf",
};

export const driveTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ query, type, account }) =>
          runTool(async () => {
            const { drive, accountEmail } = await api(ctx.userId, account);
            const parts = ["trashed = false"];
            if (query) parts.push(`name contains '${esc(query)}'`);
            if (type && type !== "any")
              parts.push(`mimeType = '${MIME[type]}'`);
            const r = await drive.files.list({
              q: parts.join(" and "),
              pageSize: 20,
              orderBy: "modifiedTime desc",
              fields: "files(id,name,mimeType,webViewLink,modifiedTime)",
            });
            return { account: accountEmail, files: r.data.files ?? [] };
          }),
        {
          name: "google_drive_search_files",
          description:
            "Search Google Drive files and folders by name and type.",
          schema: z.object({
            query: z
              .string()
              .optional()
              .describe("Text the file name contains"),
            type: z
              .enum(["any", "folder", "document", "spreadsheet", "pdf"])
              .optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ name, parent_id, account }) =>
          runTool(async () => {
            const { drive, accountEmail } = await api(ctx.userId, account);
            const r = await drive.files.create({
              requestBody: {
                name,
                mimeType: MIME.folder,
                parents: parent_id ? [parent_id] : undefined,
              },
              fields: "id,name,webViewLink",
            });
            if (r.data.id) {
              await recordLibraryItem({
                userId: ctx.userId,
                kind: "folder",
                title: r.data.name ?? name,
                fileId: r.data.id,
                account: accountEmail,
                link:
                  r.data.webViewLink ??
                  `https://drive.google.com/drive/folders/${r.data.id}`,
              });
            }
            return { account: accountEmail, folder: r.data };
          }),
        {
          name: "google_drive_create_folder",
          description:
            "Create a folder in Google Drive (optionally inside another folder).",
          schema: z.object({
            name: z.string(),
            parent_id: z.string().optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ file_id, folder_id, account }) =>
          runTool(async () => {
            const { drive, accountEmail } = await api(ctx.userId, account);
            const cur = await drive.files.get({
              fileId: file_id,
              fields: "parents",
            });
            const r = await drive.files.update({
              fileId: file_id,
              addParents: folder_id,
              removeParents: (cur.data.parents ?? []).join(","),
              fields: "id,name,webViewLink,parents",
            });
            return { account: accountEmail, moved: r.data };
          }),
        {
          name: "google_drive_move_file",
          description:
            "Move a file or folder into another folder. May fail for files this app did not create.",
          schema: z.object({
            file_id: z.string(),
            folder_id: z.string(),
            account: accountField,
          }),
        },
      ),
  },
];

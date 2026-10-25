import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service";
import { accountField, runTool, ToolError, type ToolDef } from "./_shared";

const APP_ID = 6;
const LIST = "@default";

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return { tasks: google.tasks({ version: "v1", auth }), accountEmail };
}

export const tasksTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ include_completed, account }) =>
          runTool(async () => {
            const { tasks, accountEmail } = await api(ctx.userId, account);
            const r = await tasks.tasks.list({
              tasklist: LIST,
              showCompleted: !!include_completed,
              maxResults: 30,
            });
            return {
              account: accountEmail,
              tasks: (r.data.items ?? []).map((t) => ({
                id: t.id,
                title: t.title,
                notes: t.notes,
                due: t.due?.slice(0, 10),
                status: t.status,
              })),
            };
          }),
        {
          name: "google_tasks_list_tasks",
          description: "List the student's Google Tasks (pending by default).",
          schema: z.object({
            include_completed: z.boolean().optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ tasks: items, account }) =>
          runTool(async () => {
            if (!items.length || items.length > 20)
              throw new ToolError("Provide 1 to 20 tasks.");
            const { tasks, accountEmail } = await api(ctx.userId, account);
            const created = [];
            for (const t of items) {
              const r = await tasks.tasks.insert({
                tasklist: LIST,
                requestBody: {
                  title: t.title,
                  notes: t.notes,
                  due: t.due ? `${t.due}T00:00:00.000Z` : undefined,
                },
              });
              created.push({
                id: r.data.id,
                title: r.data.title,
                due: t.due ?? null,
              });
            }
            return { account: accountEmail, created };
          }),
        {
          name: "google_tasks_create_tasks",
          description: "Create one or more study tasks in Google Tasks.",
          schema: z.object({
            tasks: z.array(
              z.object({
                title: z.string(),
                notes: z.string().optional(),
                due: z.string().optional().describe("Due date as YYYY-MM-DD"),
              }),
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
        async ({ task_id, account }) =>
          runTool(async () => {
            const { tasks, accountEmail } = await api(ctx.userId, account);
            const r = await tasks.tasks.patch({
              tasklist: LIST,
              task: task_id,
              requestBody: { status: "completed" },
            });
            return {
              account: accountEmail,
              completed: { id: r.data.id, title: r.data.title },
            };
          }),
        {
          name: "google_tasks_complete_task",
          description:
            "Mark a Google Task as completed. Get task_id from google_tasks_list_tasks.",
          schema: z.object({ task_id: z.string(), account: accountField }),
        },
      ),
  },
];

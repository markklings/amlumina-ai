import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { tasks } from "../db/schema.js";
import { runTool, ToolError, type ToolDef } from "./_shared.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const taskTools: ToolDef[] = [
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ include_completed }) =>
          runTool(async () => {
            const rows = await db
              .select()
              .from(tasks)
              .where(eq(tasks.userId, ctx.userId))
              .limit(100);
            return {
              tasks: rows
                .filter((t: any) => include_completed || !t.completed)
                .map((t) => ({
                  id: t.id,
                  title: t.title,
                  notes: t.notes,
                  due: t.dueDate,
                  completed: t.completed,
                })),
            };
          }),
        {
          name: "tasks_list",
          description: "List the student's tasks (pending by default).",
          schema: z.object({ include_completed: z.boolean().optional() }),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ tasks: items }) =>
          runTool(async () => {
            if (!items.length || items.length > 20)
              throw new ToolError("Provide 1 to 20 tasks.");
            const rows = items.map((t: any) => {
              if (t.due && !DATE.test(t.due))
                throw new ToolError(
                  `Invalid due date for "${t.title}". Use YYYY-MM-DD.`,
                );
              return {
                id: randomUUID(),
                userId: ctx.userId,
                title: t.title.slice(0, 255),
                notes: t.notes?.slice(0, 2000) ?? null,
                dueDate: t.due ?? null,
              };
            });
            await db.insert(tasks).values(rows);
            return {
              created: rows.map((r: any) => ({
                id: r.id,
                title: r.title,
                due: r.dueDate,
              })),
            };
          }),
        {
          name: "tasks_create",
          description: "Create one or more study tasks.",
          schema: z.object({
            tasks: z.array(
              z.object({
                title: z.string(),
                notes: z.string().optional(),
                due: z.string().optional().describe("YYYY-MM-DD"),
              }),
            ),
          }),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ task_id }) =>
          runTool(async () => {
            const [r] = await db
              .update(tasks)
              .set({ completed: true, completedAt: new Date() })
              .where(and(eq(tasks.id, task_id), eq(tasks.userId, ctx.userId)));
            if (r.affectedRows === 0) throw new ToolError("Task not found.");
            return { completed: true };
          }),
        {
          name: "tasks_complete",
          description: "Mark a task as done. Get task_id from tasks_list.",
          schema: z.object({ task_id: z.string() }),
        },
      ),
  },
];

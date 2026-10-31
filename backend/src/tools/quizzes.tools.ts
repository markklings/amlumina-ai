import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { quizzes } from "../db/schema.js";
import { runTool, ToolError, type ToolDef } from "./_shared.js";

const MAX_QUIZZES = 100;

export const quizTools: ToolDef[] = [
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ title, questions }) =>
          runTool(async () => {
            if (questions.length < 1 || questions.length > 30)
              throw new ToolError("Provide 1 to 30 questions.");
            const existing = await db
              .select({ id: quizzes.id })
              .from(quizzes)
              .where(eq(quizzes.userId, ctx.userId))
              .limit(MAX_QUIZZES);
            if (existing.length >= MAX_QUIZZES)
              throw new ToolError(
                "The student has too many quizzes. Ask them to delete some.",
              );

            const clean = questions.map((q: any, i: any) => {
              if (q.options.length < 2 || q.options.length > 6)
                throw new ToolError(`Question ${i + 1} needs 2 to 6 options.`);
              if (q.answer_index < 0 || q.answer_index >= q.options.length)
                throw new ToolError(
                  `Question ${i + 1} has an invalid answer_index.`,
                );
              return {
                prompt: q.prompt.slice(0, 500),
                options: q.options.map((o: any) => o.slice(0, 300)),
                answerIndex: q.answer_index,
                explanation: (q.explanation ?? "").slice(0, 600),
              };
            });

            const id = randomUUID();
            await db.insert(quizzes).values({
              id,
              userId: ctx.userId,
              title: title.slice(0, 255),
              questions: clean,
            });
            return {
              quiz_id: id,
              title,
              questions: clean.length,
              link: `/practice/quiz/${id}`,
            };
          }),
        {
          name: "quizzes_create",
          description:
            "Create a multiple-choice quiz. answer_index is the zero-based index of the one correct option. Put all questions in this one call.",
          schema: z.object({
            title: z.string(),
            questions: z.array(
              z.object({
                prompt: z.string(),
                options: z.array(z.string()),
                answer_index: z.number().int(),
                explanation: z.string().optional(),
              }),
            ),
          }),
        },
      ),
  },
];

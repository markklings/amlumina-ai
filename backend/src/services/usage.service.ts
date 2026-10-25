import { and, eq, sql } from "drizzle-orm";
import { db } from "../db/index.js";
import { aiUsage } from "../db/schema.js";

export const DAILY_TOKEN_LIMIT = 100_000;

const today = () => new Date().toISOString().slice(0, 10);

export async function tokensUsedToday(userId: string): Promise<number> {
  const [r] = await db
    .select({ i: aiUsage.inputTokens, o: aiUsage.outputTokens })
    .from(aiUsage)
    .where(and(eq(aiUsage.userId, userId), eq(aiUsage.day, today())))
    .limit(1);
  return (r?.i ?? 0) + (r?.o ?? 0);
}

export async function recordUsage(
  userId: string,
  input: number,
  output: number,
) {
  await db
    .insert(aiUsage)
    .values({
      userId: userId,
      day: today(),
      inputTokens: input,
      outputTokens: output,
    })
    .onDuplicateKeyUpdate({
      set: {
        inputTokens: sql`${aiUsage.inputTokens} + ${input}`,
        outputTokens: sql`${aiUsage.outputTokens} + ${output}`,
      },
    });
}

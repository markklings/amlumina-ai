import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db/index.js";
import { flashCards, flashDecks } from "../db/schema.js";
import { runTool, ToolError, type ToolDef } from "./_shared.js";

const MAX_DECKS = 100;

export const flashcardTools: ToolDef[] = [
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ title, cards }) =>
          runTool(async () => {
            if (cards.length < 1 || cards.length > 60)
              throw new ToolError("Provide 1 to 60 cards.");
            const existing = await db
              .select({ id: flashDecks.id })
              .from(flashDecks)
              .where(eq(flashDecks.userId, ctx.userId))
              .limit(MAX_DECKS);
            if (existing.length >= MAX_DECKS)
              throw new ToolError(
                "The student has too many decks. Ask them to delete some.",
              );

            const deckId = randomUUID();
            await db.transaction(async (tx) => {
              await tx.insert(flashDecks).values({
                id: deckId,
                userId: ctx.userId,
                title: title.slice(0, 255),
              });
              await tx.insert(flashCards).values(
                cards.map((c) => ({
                  id: randomUUID(),
                  userId: ctx.userId,
                  deckId,
                  front: c.front.slice(0, 1000),
                  back: c.back.slice(0, 1000),
                })),
              );
            });
            return {
              deck_id: deckId,
              title,
              cards: cards.length,
              link: `/practice/deck/${deckId}`,
            };
          }),
        {
          name: "flashcards_create_deck",
          description:
            "Create a flashcard deck for spaced-repetition review. Put every card in this one call. Each card has a short front (question or term) and a back (answer).",
          schema: z.object({
            title: z.string(),
            cards: z.array(z.object({ front: z.string(), back: z.string() })),
          }),
        },
      ),
  },
];

import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, isNull, lt, or } from "drizzle-orm";
import { db } from "../db/index";
import { chats, messages, users, type Message } from "../db/schema";
import { DEFAULT_METHOD, getMethod } from "../constants/methods";
import { decrypt } from "../utils/crypto";
import { ok, fail } from "../utils/response";
import { requireAuth } from "../middleware/auth";
import {
  classifyAiError,
  sanitizeHistory,
  streamTutorReply,
} from "../services/ai.service";
import { env } from "../config/env";

const router = Router();
router.use(requireAuth);

const HISTORY_LIMIT = 30;
const STALE_LOCK_MS = 2 * 60_000;
const FLUSH_EVERY_MS = 1500;

const publicChat = (c: typeof chats.$inferSelect) => ({
  id: c.id,
  title: c.title,
  learning_method_id: c.learningMethodId,
  created_at: c.createdAt,
  updated_at: c.updatedAt,
});

const publicMessage = (m: Message) => ({
  id: m.id,
  role: m.role,
  content: m.content,
  status: m.status,
  created_at: m.createdAt,
});

async function getOwnedChat(id: string, userId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, id), eq(chats.userId, userId)))
    .limit(1);
  return chat;
}

const newChatSchema = z.object({
  title: z.string().trim().min(1).max(255).optional(),
});

router.post("/chat/new", async (req, res, next) => {
  try {
    const parsed = newChatSchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user) {
      return fail(res, 404, "USER_NOT_FOUND", "User not found");
    }
    if (!user.learningMethodId || !getMethod(user.learningMethodId)) {
      return fail(
        res,
        409,
        "METHOD_REQUIRED",
        "Choose a learning method first (POST /api/method/choose)",
      );
    }
    if (!user.geminiApiKeyEncrypted) {
      return fail(
        res,
        409,
        "GEMINI_KEY_REQUIRED",
        "Add your Gemini API key before starting a chat",
      );
    }

    const id = randomUUID();
    await db.insert(chats).values({
      id: id,
      userId: user.id,
      title: parsed.data.title ?? "New chat",
      learningMethodId: user.learningMethodId,
    });

    const chat = await getOwnedChat(id, user.id);
    return ok(res, { chat: publicChat(chat!) }, 201);
  } catch (e) {
    next(e);
  }
});

const retrieveQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  before: z.coerce.date().optional(),
});

router.get("/chat/retrieve/:id", async (req, res, next) => {
  try {
    const q = retrieveQuery.safeParse(req.query);
    if (!q.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid Query",
        q.error.flatten().fieldErrors,
      );
    }

    const chat = await getOwnedChat(String(req.params.id), req.userId!);
    if (!chat) {
      return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");
    }

    const { limit, before } = q.data;
    const rows = await db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.chatId, chat.id),
          before ? lt(messages.createdAt, before) : undefined,
        ),
      )
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = rows.slice(0, limit).reverse();

    return ok(res, {
      chat: publicChat(chat),
      messages: page.map(publicMessage),
      has_more: hasMore,
      next_before: hasMore ? page[0].createdAt.toISOString() : null,
    });
  } catch (e) {
    next(e);
  }
});

router.get("/chat/current/:id", async (req, res, next) => {
  try {
    const chat = await getOwnedChat(String(req.params.id), req.userId!);
    if (!chat) {
      return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");
    }

    const [latest] = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chat.id))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(1);

    const isStreaming =
      !!chat.streamingStartedAt &&
      chat.streamingStartedAt.getTime() > Date.now() - STALE_LOCK_MS &&
      latest?.role === "assistant" &&
      latest.status === "streaming";

    return ok(res, {
      chat_id: chat.id,
      is_streaming: isStreaming,
      message: isStreaming ? publicMessage(latest) : null,
    });
  } catch (e) {
    next(e);
  }
});

const sendSchema = z.object({ message: z.string().trim().min(1).max(8000) });

router.post("/chat/current/:id", async (req, res, next) => {
  const chatId = String(req.params.id);
  let locked = false;
  const release = () =>
    db
      .update(chats)
      .set({ streamingStartedAt: null })
      .where(eq(chats.id, chatId));

  try {
    const parsed = sendSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }
    const input = parsed.data.message;

    const chat = await getOwnedChat(chatId, req.userId!);
    if (!chat) return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);
    if (!user?.geminiApiKeyEncrypted) {
      return fail(
        res,
        409,
        "GEMINI_KEY_REQUIRED",
        "Add your Gemini API key before chatting",
      );
    }

    let apiKey: string;

    try {
      apiKey = decrypt(user.geminiApiKeyEncrypted);
    } catch (e) {
      console.error("Gemini API Key Error:", e)
      return fail(
        res,
        409,
        "GEMINI_KEY_UNREADABLE",
        "Your saved Gemini API key could not be read. Please re-enter it.",
      );
    }

    // const apiKey = decrypt(user.geminiApiKeyEncrypted);
    const method = getMethod(chat.learningMethodId) ?? DEFAULT_METHOD;

    const [lock] = await db
      .update(chats)
      .set({ streamingStartedAt: new Date() })
      .where(
        and(
          eq(chats.id, chatId),
          or(
            isNull(chats.streamingStartedAt),
            lt(chats.streamingStartedAt, new Date(Date.now() - STALE_LOCK_MS)),
          ),
        ),
      );

    if (lock.affectedRows === 0) {
      return fail(
        res,
        409,
        "CHAT_BUSY",
        "This chat is still generating a reply",
      );
    }
    locked = true;

    const past = await db
      .select({
        role: messages.role,
        content: messages.content,
        status: messages.status,
      })
      .from(messages)
      .where(eq(messages.chatId, chatId))
      .orderBy(desc(messages.createdAt), desc(messages.id))
      .limit(HISTORY_LIMIT);
    const history = sanitizeHistory(past.reverse());

    const now = Date.now();
    const userMsgId = randomUUID();
    const aiMsgId = randomUUID();
    await db.insert(messages).values([
      {
        id: userMsgId,
        chatId: chatId,
        role: "user",
        content: input,
        status: "complete",
        createdAt: new Date(now),
      },
      {
        id: aiMsgId,
        chatId: chatId,
        role: "assistant",
        content: "",
        status: "streaming",
        model: env.GEMINI_MODEL,
        createdAt: new Date(now + 1),
      },
    ]);

    let title = chat.title;
    if (title === "New chat") {
      title = input.replace(/\s+/g, " ").slice(0, 60);
      await db.update(chats).set({ title: title }).where(eq(chats.id, chatId));
    }

    res.status(200).set({
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    res.flushHeaders();

    const send = (event: string, data: unknown) => {
      if (!res.writableEnded) {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      }
    };

    const controller = new AbortController();
    res.on("close", () => {
      if (!res.writableFinished) {
        controller.abort();
      }
    });

    send("start", {
      chat_id: chatId,
      chat_title: title,
      user_message_id: userMsgId,
      assistant_message_id: aiMsgId,
    });

    let full = "";
    let status: "complete" | "stopped" | "error" = "complete";
    let err: { code: string; message: string } | null = null;
    let lastFlush = Date.now();

    try {
      for await (const delta of streamTutorReply({
        apiKey: apiKey,
        method: method,
        studentName: user.fullName,
        history: history,
        input: input,
        signal: controller.signal,
      })) {
        full += delta;
        send("token", { delta: delta });

        if (Date.now() - lastFlush > FLUSH_EVERY_MS) {
          lastFlush = Date.now();
          await db
            .update(messages)
            .set({ content: full })
            .where(eq(messages.id, aiMsgId));
        }
      }
      if (!full.trim()) {
        status = "error";
        err = {
          code: "EMPTY_RESPONSE",
          message: "The model returned an empty response.",
        };
      }
    } catch (e) {
      if (controller.signal.aborted) {
        status = "stopped";
      } else {
        console.error("AI stream failed:", e);
        status = "error";
        err = classifyAiError(e);
      }
    }

    try {
      await db
        .update(messages)
        .set({ content: full, status })
        .where(eq(messages.id, aiMsgId));
      await release();
      locked = false;
    } catch (e) {
      console.error("Failed to finalize message:", e);
    }

    if (status === "error") send("error", err);
    else send("done", { message_id: aiMsgId, status });
    res.end();
  } catch (e) {
    if (locked) await release().catch(() => {});
    if (res.headersSent) return res.end();
    next(e);
  }
});

export default router;

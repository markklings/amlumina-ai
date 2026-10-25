import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { and, desc, eq, isNull, like, lt, or } from "drizzle-orm";
import rateLimit from "express-rate-limit";
import { db } from "../db/index";
import { chats, messages, users, type Message } from "../db/schema";
import { DEFAULT_METHOD, getMethod } from "../constants/methods";
import { safeTimeZone } from "../constants/prompts";
import { decrypt } from "../utils/crypto";
import { ok, fail } from "../utils/response";
import { requireAuth } from "../middleware/auth";
import {
  classifyAiError,
  sanitizeHistory,
  streamTutorAgent,
  trimToBudget,
} from "../services/ai.service";
import { loadToolsForUser } from "../tools/index";
import {
  DAILY_TOKEN_LIMIT,
  recordUsage,
  tokensUsedToday,
} from "../services/usage.service";
import { env } from "../config/env";

const router = Router();
router.use(requireAuth);

const HISTORY_LIMIT = 20;
const HISTORY_TOKEN_BUDGET = 2000;
const STALE_LOCK_MS = 2 * 60_000;
const FLUSH_EVERY_MS = 1500;

const chatLimiter = rateLimit({
  windowMs: 60_000,
  limit: 5,
  keyGenerator: (req) => (req as any).userId as string,
  validate: { keyGeneratorIpFallback: false },
  handler: (_req, res) =>
    fail(
      res,
      429,
      "TOO_MANY_REQUESTS",
      "You're sending messages too fast. Wait a moment.",
    ),
});

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
  tool_calls: m.toolCalls ?? [],
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

/* ───────── POST /chat/new ───────── */
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
    if (!user) return fail(res, 404, "USER_NOT_FOUND", "User not found");
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
      id,
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

/* ───────── GET /chat/list ───────── */
const listQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).default(0),
  q: z.string().trim().max(100).optional(),
});

router.get("/chat/list", async (req, res, next) => {
  try {
    const parsed = listQuery.safeParse(req.query);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid query",
        parsed.error.flatten().fieldErrors,
      );
    }
    const { limit, offset, q } = parsed.data;
    const search = q ? `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%` : undefined;

    const rows = await db
      .select()
      .from(chats)
      .where(
        and(
          eq(chats.userId, req.userId!),
          search ? like(chats.title, search) : undefined,
        ),
      )
      .orderBy(desc(chats.updatedAt), desc(chats.id))
      .limit(limit + 1)
      .offset(offset);

    const hasMore = rows.length > limit;
    return ok(res, {
      chats: rows.slice(0, limit).map(publicChat),
      has_more: hasMore,
      next_offset: hasMore ? offset + limit : null,
    });
  } catch (e) {
    next(e);
  }
});

/* ───────── GET /chat/retrieve/:id ───────── */
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
        "Invalid query",
        q.error.flatten().fieldErrors,
      );
    }

    const chat = await getOwnedChat(String(req.params.id), req.userId!);
    if (!chat) return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");

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

/* ───────── GET /chat/current/:id (status snapshot) ───────── */
router.get("/chat/current/:id", async (req, res, next) => {
  try {
    const chat = await getOwnedChat(String(req.params.id), req.userId!);
    if (!chat) return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");

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

/* ───────── POST /chat/current/:id (real time, SSE + tools) ───────── */
const sendSchema = z.object({
  message: z.string().trim().min(1).max(4000),
  timezone: z.string().trim().max(64).optional(), // IANA, e.g. "Asia/Manila"
});

router.post("/chat/current/:id", chatLimiter, async (req, res, next) => {
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
    const timeZone = safeTimeZone(parsed.data.timezone);

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
      console.error("Gemini API Key Error:", e);
      return fail(
        res,
        409,
        "GEMINI_KEY_UNREADABLE",
        "Your saved Gemini API key could not be read. Please re-enter it.",
      );
    }

    if ((await tokensUsedToday(user.id)) >= DAILY_TOKEN_LIMIT) {
      return fail(
        res,
        429,
        "DAILY_LIMIT_REACHED",
        "Daily token limit reached. Try again tomorrow.",
      );
    }

    const method = getMethod(chat.learningMethodId) ?? DEFAULT_METHOD;
    const { tools, accounts } = await loadToolsForUser(user.id, timeZone);

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
    const history = trimToBudget(
      sanitizeHistory(past.reverse()),
      HISTORY_TOKEN_BUDGET,
    );

    const now = Date.now();
    const userMsgId = randomUUID();
    const aiMsgId = randomUUID();
    await db.insert(messages).values([
      {
        id: userMsgId,
        chatId,
        role: "user",
        content: input,
        status: "complete",
        createdAt: new Date(now),
      },
      {
        id: aiMsgId,
        chatId,
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
      await db.update(chats).set({ title }).where(eq(chats.id, chatId));
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
      if (!res.writableFinished) controller.abort();
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
    let usage: { input: number; output: number } | null = null;
    const trace: { name: string; ok: boolean }[] = [];

    try {
      for await (const ev of streamTutorAgent({
        apiKey,
        method,
        studentName: user.fullName,
        history,
        input,
        tools,
        accounts,
        timeZone,
        signal: controller.signal,
      })) {
        if (ev.type === "token") {
          full += ev.delta;
          send("token", { delta: ev.delta });
          if (Date.now() - lastFlush > FLUSH_EVERY_MS) {
            lastFlush = Date.now();
            await db
              .update(messages)
              .set({ content: full })
              .where(eq(messages.id, aiMsgId));
          }
        } else if (ev.type === "tool_start") {
          send("tool_start", {
            id: ev.id,
            name: ev.name,
            args_preview: ev.args_preview,
          });
        } else if (ev.type === "tool_end") {
          trace.push({ name: ev.name, ok: ev.ok });
          send("tool_end", { id: ev.id, name: ev.name, ok: ev.ok });
        } else if (ev.type === "usage") {
          usage = { input: ev.input, output: ev.output };
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
        .set({ content: full, status, toolCalls: trace.length ? trace : null })
        .where(eq(messages.id, aiMsgId));
      await release();
      locked = false;
    } catch (e) {
      console.error("Failed to finalize message:", e);
    }

    if (usage) {
      const u = usage as { input: number; output: number };
      await recordUsage(user.id, u.input, u.output).catch((e) =>
        console.error("Usage log failed:", e),
      );
    }

    if (status === "error") send("error", err);
    else send("done", { message_id: aiMsgId, status, usage });
    res.end();
  } catch (e) {
    if (locked) await release().catch(() => {});
    if (res.headersSent) return res.end();
    next(e);
  }
});

router.delete("/chat/:id", async (req, res, next) => {
  try {
    const chat = await getOwnedChat(String(req.params.id), req.userId!);
    if (!chat) return fail(res, 404, "CHAT_NOT_FOUND", "Chat not found");

    const busy =
      !!chat.streamingStartedAt &&
      chat.streamingStartedAt.getTime() > Date.now() - STALE_LOCK_MS;
    if (busy) {
      return fail(
        res,
        409,
        "CHAT_BUSY",
        "Wait for the reply to finish before deleting this chat",
      );
    }

    await db.transaction(async (tx) => {
      await tx.delete(messages).where(eq(messages.chatId, chat.id));
      await tx
        .delete(chats)
        .where(and(eq(chats.id, chat.id), eq(chats.userId, req.userId!)));
    });

    return ok(res, { deleted: true, id: chat.id });
  } catch (e) {
    next(e);
  }
});

export default router;

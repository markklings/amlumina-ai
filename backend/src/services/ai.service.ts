import { randomUUID } from "node:crypto";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  AIMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
  type AIMessageChunk,
  type BaseMessage,
} from "@langchain/core/messages";
import type { DynamicStructuredTool } from "@langchain/core/tools";
import { env } from "../config/env.js";
import {
  buildSystemPrompt,
  type LearningMethod,
} from "../constants/methods.js";
import { LIGHT_TASK_PROMPT, buildContextBlock } from "../constants/prompts.js";
import { isErrorOutput } from "../tools/_shared.js";

const MAX_TOOL_STEPS = 5; // model→tools round trips per message (caps cost and loops)

export interface HistoryRow {
  role: "user" | "assistant";
  content: string;
  status: "complete" | "streaming" | "stopped" | "error";
}

export type AgentEvent =
  | { type: "token"; delta: string }
  | { type: "tool_start"; id: string; name: string; args_preview: string }
  | { type: "tool_end"; id: string; name: string; ok: boolean }
  | { type: "usage"; input: number; output: number };

/** Keeps only clean user→assistant pairs (rows oldest → newest). */
export function sanitizeHistory(rows: HistoryRow[]): BaseMessage[] {
  const kept: HistoryRow[] = [];
  rows.forEach((r, i) => {
    if (r.role === "user") {
      const next = rows[i + 1];
      if (
        next?.role === "assistant" &&
        next.status !== "error" &&
        next.status !== "streaming" &&
        next.content
      )
        kept.push(r);
    } else if (
      r.status !== "error" &&
      r.status !== "streaming" &&
      r.content &&
      kept.at(-1)?.role === "user"
    ) {
      kept.push(r);
    }
  });
  return kept.map((r) =>
    r.role === "user" ? new HumanMessage(r.content) : new AIMessage(r.content),
  );
}

const estimateTokens = (s: string) => Math.ceil(s.length / 4);

/** Newest messages that fit in the budget; always starts on a user turn. */
export function trimToBudget(
  history: BaseMessage[],
  budget: number,
): BaseMessage[] {
  const out: BaseMessage[] = [];
  let used = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    const t = estimateTokens(String(history[i].content)) + 4;
    if (used + t > budget) break;
    used += t;
    out.unshift(history[i]);
  }
  while (out.length && out[0] instanceof AIMessage) out.shift();
  return out;
}

const chunkText = (c: { content: unknown }): string =>
  typeof c.content === "string"
    ? c.content
    : Array.isArray(c.content)
      ? c.content.map((p: any) => (p?.type === "text" ? p.text : "")).join("")
      : "";

function fallbackFromTools(results: { name: string; out: string }[]): string {
  const lines = results.map(({ name, out }) => {
    const label = name.replace(/_/g, " ");
    try {
      const j = JSON.parse(out);
      if (j.error) return `- ${label}: failed (${j.error})`;
      const link = j.link ?? j.folder?.webViewLink ?? j.created?.[0]?.link;
      return link ? `- ${label}: done. ${link}` : `- ${label}: done`;
    } catch {
      return `- ${label}: done`;
    }
  });
  return `I ran your request, but the model did not write a summary. Here is what happened:\n\n${lines.join("\n")}`;
}

export async function* streamTutorAgent(opts: {
  apiKey: string;
  method: LearningMethod;
  studentName: string;
  history: BaseMessage[];
  input: string;
  tools: DynamicStructuredTool<any>[];
  accounts: { email: string; type: string; apps: number[] }[];
  timeZone: string;
  signal?: AbortSignal;
}): AsyncGenerator<AgentEvent> {
  const llm = new ChatGoogleGenerativeAI({
    apiKey: opts.apiKey,
    model: env.GEMINI_MODEL,
    temperature: opts.method.tuning.temperature,
    topP: opts.method.tuning.topP,
    // maxOutputTokens: opts.method.tuning.maxOutputTokens - oldest,
    maxOutputTokens: Math.max(
      opts.method.tuning.maxOutputTokens,
      opts.tools.length ? 4096 : 0,
    ),
    maxRetries: 1,
  });
  const model = opts.tools.length ? llm.bindTools(opts.tools) : llm;
  const byName = Object.fromEntries(opts.tools.map((t) => [t.name, t]));

  const system = [
    buildSystemPrompt(opts.method, opts.studentName),
    LIGHT_TASK_PROMPT,
    buildContextBlock({
      timeZone: opts.timeZone,
      accounts: opts.accounts.map((a) => ({
        email: a.email,
        type: a.type,
        apps: a.apps,
      })),
    }),
  ].join("\n\n");

  const messages: BaseMessage[] = [
    new SystemMessage(system),
    ...opts.history,
    new HumanMessage(opts.input),
  ];
  let totalIn = 0;
  let totalOut = 0;
  let finished = false;

  const ran: { name: string; out: string }[] = [];

  for (let step = 0; step < MAX_TOOL_STEPS; step++) {
    opts.signal?.throwIfAborted();

    let aggregate: AIMessageChunk | undefined;
    let stepUsage: { input: number; output: number } | null = null;

    let stepText = "";

    const stream = await model.stream(messages, { signal: opts.signal });
    for await (const chunk of stream) {
      aggregate = aggregate ? aggregate.concat(chunk) : chunk;
      const u = (chunk as any).usage_metadata;
      if (u)
        stepUsage = {
          input: u.input_tokens ?? 0,
          output: u.output_tokens ?? 0,
        }; // last one wins
      const text = chunkText(chunk);
      // if (text) yield { type: "token", delta: text }; - old
      if (text) {
        stepText += text;
        yield { type: "token", delta: text };
      }
    }
    if (stepUsage) {
      totalIn += stepUsage.input;
      totalOut += stepUsage.output;
    }

    const calls = aggregate?.tool_calls ?? [];
    // if (!aggregate || !calls.length) {
    //   finished = true;
    //   break;
    // } - old
    if (!aggregate || !calls.length) {
      if (!stepText.trim()) {
        console.warn("Empty model reply", {
          step,
          meta: aggregate?.response_metadata,
        });
        if (ran.length) yield { type: "token", delta: fallbackFromTools(ran) };
      }
      finished = true;
      break;
    }

    messages.push(aggregate);
    for (const call of calls) {
      const id = call.id ?? randomUUID();
      yield {
        type: "tool_start",
        id,
        name: call.name,
        args_preview: JSON.stringify(call.args).slice(0, 200),
      };

      let out: string;
      try {
        const t = byName[call.name];
        if (!t) throw new Error(`Unknown tool ${call.name}`);
        out = String(await t.invoke(call.args, { signal: opts.signal }));
      } catch (e) {
        if (opts.signal?.aborted) throw e;
        out = JSON.stringify({
          error: e instanceof Error ? e.message.slice(0, 200) : "Tool failed",
        });
      }

      ran.push({ name: call.name, out });

      yield { type: "tool_end", id, name: call.name, ok: !isErrorOutput(out) };
      messages.push(
        new ToolMessage({ content: out, tool_call_id: id, name: call.name }),
      );
    }
  }

  if (!finished)
    yield {
      type: "token",
      delta:
        "\n\n_I reached the tool limit for one message. Ask me to continue._",
    };
  if (totalIn || totalOut)
    yield { type: "usage", input: totalIn, output: totalOut };
}

export function classifyAiError(e: unknown): { code: string; message: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as any)?.status ?? (e as any)?.response?.status;
  console.error("Gemini error:", status, msg);

  if (
    status === 429 ||
    /\b429\b|RESOURCE_EXHAUSTED|quota|too many requests|rate limit/i.test(msg)
  )
    return {
      code: "RATE_LIMITED",
      message: "Gemini rate limit or quota reached. Try again shortly.",
    };
  if (
    status === 404 ||
    /\b404\b|not found|not supported for generateContent/i.test(msg)
  )
    return {
      code: "MODEL_NOT_FOUND",
      message: "The configured Gemini model is not available for this key.",
    };
  if (
    status === 401 ||
    status === 403 ||
    /API_KEY_INVALID|api key not valid|permission denied|\b403\b/i.test(msg)
  )
    return {
      code: "INVALID_GEMINI_KEY",
      message: "Your Gemini API key was rejected. Please update it.",
    };
  if (/safety|blocked/i.test(msg))
    return {
      code: "BLOCKED",
      message: "The response was blocked by Gemini safety filters.",
    };
  return {
    code: "AI_ERROR",
    message: "The AI failed to respond. Please try again.",
  };
}

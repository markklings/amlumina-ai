import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import {
  AIMessage,
  HumanMessage,
  type BaseMessage,
} from "@langchain/core/messages";
import { env } from "../config/env";
import { buildSystemPrompt, type LearningMethod } from "../constants/methods";

export interface HistoryRow {
  role: "user" | "assistant";
  content: string;
  status: "complete" | "streaming" | "stopped" | "error";
}

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "{system_prompt}"],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

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
      ) {
        kept.push(r);
      }
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

export async function* streamTutorReply(opts: {
  apiKey: string;
  method: LearningMethod;
  studentName: string;
  history: BaseMessage[];
  input: string;
  signal?: AbortSignal;
}): AsyncGenerator<string> {
  const model = new ChatGoogleGenerativeAI({
    apiKey: opts.apiKey,
    model: env.GEMINI_MODEL,
    temperature: opts.method.tuning.temperature,
    topP: opts.method.tuning.topP,
    maxOutputTokens: opts.method.tuning.maxOutputTokens,
  });

  const chain = prompt.pipe(model).pipe(new StringOutputParser());

  const stream = await chain.stream(
    {
      system_prompt: buildSystemPrompt(opts.method, opts.studentName),
      history: opts.history,
      input: opts.input,
    },
    { signal: opts.signal },
  );

  for await (const chunk of stream) yield chunk;
}

export function classifyAiError(e: unknown): { code: string; message: string } {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as any)?.status ?? (e as any)?.response?.status;
  console.error("Gemini Model:", status, msg);

  if (status === 429 || /\b429\b|RESOURCE_EXHAUSTED|quota|too many requests|rate limit/i.test(msg)) {
    return { code: "RATE_LIMITED", message: "Gemini rate limit or quota reached. Try again shortly." };
  }
  if (status === 404 || /\b404\b|not found|not supported for generateContent/i.test(msg)) {
    return { code: "MODEL_NOT_FOUND", message: "The configured Gemini model is not available for this key." };
  }
  if (status === )
}

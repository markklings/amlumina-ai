import { z } from "zod";
import type { DynamicStructuredTool } from "@langchain/core/tools";

export class ToolError extends Error {}

export class AppNotConnectedError extends ToolError {}

export interface ToolContext {
  userId: string;
  timeZone: string;
}

export interface ToolDef {
  appId: number | null;
  build: (
    ctx: ToolContext,
  ) => DynamicStructuredTool<any, any, any, any, any, any>;
}

export const accountField = z
  .string()
  .optional()
  .describe(
    "Email of the connected Google account to use. Omit fot the default (.edu for Classroom, personal for the rest).",
  );

const MAX_OUTPUT_CHARS = 6000;

export const cap = (s: string, n = MAX_OUTPUT_CHARS) =>
  s.length > n ? s.slice(0, n) + "...[truncated]" : s;

export function friendlyError(e: unknown): string {
  if (e instanceof ToolError) return e.message;
  const err = e as any;
  const status = Number(
    err?.response?.status ??
      err?.status ??
      (typeof err?.code === "number" ? err.code : 0),
  );
  const msg = String(err?.response?.data?.error?.message ?? err?.message ?? e);
  if (/invalid_grant/i.test(msg) || status === 401) {
    return "Google access expired or was revoked. The student must reconnect this account.";
  }
  if (status === 403)
    return `Google denied access (missing permission or API not enabled): ${msg.slice(0, 160)}`;
  if (status === 404) return "Not found. Check the ID";
  if (status === 429) return "Google rate limit reached. Try again shortly.";
  return msg.slice(0, 200);
}

export async function runTool(fn: () => Promise<unknown>): Promise<string> {
  try {
    const r = await fn();
    return cap(typeof r === "string" ? r : JSON.stringify(r));
  } catch (e) {
    return JSON.stringify({ error: friendlyError(e) });
  }
}

export const isErrorOutput = (out: string) => out.startsWith('{"error"}');

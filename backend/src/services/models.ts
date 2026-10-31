import { env } from "../config/env.js";

const ALL = (env.GEMINI_MODELS ?? env.GEMINI_MODEL)
  .split(",")
  .map((m) => m.trim())
  .filter(Boolean);

const cooldown = new Map<string, number>(); // per server instance, best effort

/** Models in priority order, skipping ones that failed recently. Never returns an empty list. */
export function modelChain(): string[] {
  const now = Date.now();
  const ok = ALL.filter((m) => (cooldown.get(m) ?? 0) <= now);
  return ok.length ? ok : ALL;
}

const statusOf = (e: unknown): number => {
  const x = e as { status?: unknown; response?: { status?: unknown } };
  return Number(x?.status ?? x?.response?.status ?? 0);
};

export function shouldFallback(e: unknown): boolean {
  const status = statusOf(e);
  const msg = e instanceof Error ? e.message : String(e);

  if (status === 401 || status === 403) return false;
  if (/API_KEY_INVALID|api key not valid|permission denied/i.test(msg))
    return false;
  if (/safety|blocked/i.test(msg)) return false;

  return (
    [404, 429, 500, 502, 503, 504].includes(status) ||
    /\b(404|429|500|502|503|504)\b|RESOURCE_EXHAUSTED|UNAVAILABLE|overloaded|quota|not found|not supported|timeout|timed out|ETIMEDOUT|ECONNRESET|fetch failed/i.test(
      msg,
    )
  );
}

export function markFailed(model: string, e: unknown) {
  const status = statusOf(e);
  const ms = status === 404 ? 10 * 60_000 : status === 429 ? 60_000 : 30_000;
  cooldown.set(model, Date.now() + ms);
}

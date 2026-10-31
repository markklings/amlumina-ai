import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";
import { fail } from "../utils/response.js";

const redis =
  env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: env.UPSTASH_REDIS_REST_URL,
        token: env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

let counter = 0;
const tooMany = (res: Response) =>
  fail(res, 429, "TOO_MANY_REQUESTS", "Too many attempts. Try again later.");

/** by "user" needs requireAuth to run first. Give shared limits a stable `name`. */
export function limiter(
  limit: number,
  windowMs = 15 * 60_000,
  by: "ip" | "user" = "ip",
  name?: string,
) {
  const id = name ?? String(++counter);

  if (!redis) {
    return rateLimit({
      windowMs,
      limit,
      standardHeaders: true,
      legacyHeaders: false,
      validate: { keyGeneratorIpFallback: false },
      keyGenerator: (req) =>
        by === "user"
          ? ((req as Request).userId ?? req.ip ?? "x")
          : (req.ip ?? "x"),
      handler: (_req, res) => tooMany(res),
    });
  }

  const rl = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(
      limit,
      `${Math.max(1, Math.ceil(windowMs / 1000))} s` as `${number} s`,
    ),
    prefix: `rl:${id}`,
    analytics: false,
  });

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const key =
        by === "user" ? (req.userId ?? req.ip ?? "anon") : (req.ip ?? "anon");
      const r = await rl.limit(key);
      if (!r.success) {
        res.setHeader(
          "Retry-After",
          String(Math.max(1, Math.ceil((r.reset - Date.now()) / 1000))),
        );
        return tooMany(res);
      }
    } catch (e) {
      console.error(
        "Rate limit store failed (allowing request):",
        e instanceof Error ? e.message : e,
      );
    }
    next();
  };
}

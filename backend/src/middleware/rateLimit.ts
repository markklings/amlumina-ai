import rateLimit from "express-rate-limit";
import { fail } from "../utils/response.js";

export const limiter = (limit: number, windowMs = 15 * 60_000) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) =>
      fail(
        res,
        429,
        "TOO_MANY_REQUESTS",
        "Too many attempts. Try again later.",
      ),
  });

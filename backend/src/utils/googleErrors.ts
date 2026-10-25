import type { Response } from "express";
import {
  AppNotConnectedError,
  ToolError,
  friendlyError,
} from "../tools/_shared";
import { fail } from "./response";

export function respondGoogleError(res: Response, e: unknown): boolean {
  if (e instanceof AppNotConnectedError) {
    fail(res, 409, "APP_NOT_CONNECTED", e.message);
    return true;
  }
  if (e instanceof ToolError) {
    fail(res, 409, "GOOGLE_RECONNECT_REQUIRED", e.message);
    return true;
  }
  const err = e as any;
  const status = Number(
    err?.response?.status ??
      err?.status ??
      (typeof err?.code === "number" ? err.code : 0),
  );
  if (status || /invalid_grant/i.test(String(err?.message ?? ""))) {
    fail(res, 502, "GOOGLE_API_ERROR", friendlyError(e));
    return true;
  }
  return false;
}

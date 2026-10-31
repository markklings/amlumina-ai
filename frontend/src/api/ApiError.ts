import { AuthError } from "../lib/authError";

export const NETWORK_MESSAGE =
  "Cannot reach the server. Check your connection and try again.";

export class ApiError extends AuthError {
  status: number;
  details?: unknown;

  constructor(
    code: string,
    message: string,
    status: number,
    details?: unknown,
  ) {
    super(code, message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export function retryAfterOf(e: unknown): number | null {
  const d =
    e instanceof ApiError
      ? (e.details as { retry_after_seconds?: unknown } | undefined)
      : undefined;
  return typeof d?.retry_after_seconds === "number"
    ? d.retry_after_seconds
    : null;
}

import { apiUrl } from "./config";
import { ApiError, NETWORK_MESSAGE } from "./ApiError";
import { tokenStore } from "./tokenStore";

let onSessionExpired: (() => void) | null = null;
export const setSessionExpiredHandler = (fn: (() => void) | null) => {
  onSessionExpired = fn;
};

const expire = () => {
  tokenStore.clear();
  onSessionExpired?.();
};

let inflight: Promise<string | null> | null = null;

async function runRefresh(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) {
    expire();
    return null;
  }

  let res: Response;
  try {
    res = await fetch(apiUrl("/api/auth/v1/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refresh }),
    });
  } catch {
    throw new ApiError("NETWORK_ERROR", NETWORK_MESSAGE, 0);
  }

  if (res.ok) {
    const json = await res.json().catch(() => null);
    const t = json?.data?.tokens;
    if (t?.access_token && t?.refresh_token) {
      tokenStore.set(t.access_token, t.refresh_token);
      return t.access_token as string;
    }
    throw new ApiError(
      "BAD_RESPONSE",
      "Unexpected server response.",
      res.status,
    );
  }
  if (res.status === 401 || res.status === 422) {
    expire();
    return null;
  }
  throw new ApiError(
    "REFRESH_FAILED",
    "Could not refresh your session. Try again.",
    res.status,
  );
}

export function refreshAccess(): Promise<string | null> {
  if (!inflight) {
    const task = navigator.locks
      ? navigator.locks.request("lumi-refresh", runRefresh)
      : runRefresh();
    inflight = Promise.resolve(task).finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

async function send(
  path: string,
  init: RequestInit,
  token: string | null,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  try {
    return await fetch(apiUrl(path), { ...init, headers });
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError("NETWORK_ERROR", NETWORK_MESSAGE, 0);
  }
}

export async function authFetch(
  path: string,
  init: RequestInit = {},
  auth = true,
): Promise<Response> {
  if (!auth) return send(path, init, null);

  let token = tokenStore.getAccess();
  if (!token) token = await refreshAccess();
  if (!token) throw new ApiError("UNAUTHORIZED", "Please log in again.", 401);

  const res = await send(path, init, token);
  if (res.status !== 401) return res;

  const current = tokenStore.getAccess();
  const fresh = current && current !== token ? current : await refreshAccess();
  if (!fresh) return res;
  return send(path, init, fresh);
}

export async function toApiError(res: Response): Promise<ApiError> {
  const json = await res.json().catch(() => null);
  const err = json?.error;
  return new ApiError(
    err?.code ?? "HTTP_ERROR",
    err?.message ?? `Request failed (${res.status}).`,
    res.status,
    err?.details,
  );
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function request<T>(
  path: string,
  opts: RequestOptions = {},
): Promise<T> {
  const hasBody = opts.body !== undefined;
  const res = await authFetch(
    path,
    {
      method: opts.method ?? "GET",
      headers: hasBody ? { "Content-Type": "application/json" } : undefined,
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    },
    opts.auth ?? true,
  );

  const json = await res
    .clone()
    .json()
    .catch(() => null);
  if (res.ok && json?.success) return json.data as T;
  throw await toApiError(res);
}

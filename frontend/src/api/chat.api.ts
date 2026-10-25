import type { ChatSummary, Message } from "../types/chat";
import { authFetch, request, toApiError } from "./client";
import { readSse } from "./sse";
import {
  toChatSummary,
  toMessage,
  type WireChat,
  type WireMessage,
} from "./mappers";

export interface StreamHandlers {
  onStart?: (d: { chat_id: string; chat_title: string }) => void;
  onToken?: (d: { delta: string }) => void;
  onToolStart?: (d: { id: string; name: string }) => void;
  onToolEnd?: (d: { id: string; name: string; ok: boolean }) => void;
  onDone?: (d: { message_id: string; status: string }) => void;
  onError?: (d: { code: string; message: string }) => void;
}

export const chatApi = {
  async list(): Promise<ChatSummary[]> {
    const d = await request<{ chats: WireChat[] }>(
      "/api/ai/chat/list?limit=100",
    );
    return d.chats.map(toChatSummary);
  },

  async create(): Promise<ChatSummary> {
    const d = await request<{ chat: WireChat }>("/api/ai/chat/new", {
      method: "POST",
      body: {},
    });
    return toChatSummary(d.chat);
  },

  async retrieve(
    id: string,
  ): Promise<{ messages: Message[]; hasMore: boolean }> {
    const d = await request<{ messages: WireMessage[]; has_more: boolean }>(
      `/api/ai/chat/retrieve/${encodeURIComponent(id)}?limit=100`,
    );
    return { messages: d.messages.map(toMessage), hasMore: d.has_more };
  },

  async current(
    id: string,
  ): Promise<{ isStreaming: boolean; message: Message | null }> {
    const d = await request<{
      is_streaming: boolean;
      message: WireMessage | null;
    }>(`/api/ai/chat/current/${encodeURIComponent(id)}`);
    return {
      isStreaming: d.is_streaming,
      message: d.message ? toMessage(d.message) : null,
    };
  },

  remove: (id: string) =>
    request<{ deleted: boolean }>(`/api/ai/chat/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),

  async stream(
    id: string,
    body: { message: string; timezone: string },
    h: StreamHandlers,
    signal: AbortSignal,
  ): Promise<void> {
    const res = await authFetch(
      `/api/ai/chat/current/${encodeURIComponent(id)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      },
    );

    if (
      !res.ok ||
      !(res.headers.get("content-type") ?? "").includes("text/event-stream")
    ) {
      throw await toApiError(res);
    }

    await readSse(res, (event, data) => {
      switch (event) {
        case "start":
          return h.onStart?.(data);
        case "token":
          return h.onToken?.(data);
        case "tool_start":
          return h.onToolStart?.(data);
        case "tool_end":
          return h.onToolEnd?.(data);
        case "done":
          return h.onDone?.(data);
        case "error":
          return h.onError?.(data);
      }
    });
  },
};

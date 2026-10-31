import type { CalendarEvent, EventPayload, TaskItem } from "../types/calendar";
import type { DocFull, DocSummary } from "../types/document";
import { request } from "./client";

export const documentsApi = {
  list: async (signal?: AbortSignal) =>
    (await request<{ documents: DocSummary[] }>("/api/documents", { signal }))
      .documents,
  get: async (id: string, signal?: AbortSignal) =>
    (
      await request<{ document: DocFull }>(
        `/api/documents/${encodeURIComponent(id)}`,
        { signal },
      )
    ).document,
  // create: async (title?: string, content?: string) =>
  //   (
  //     await request<{ document: DocFull }>("/api/documents", {
  //       method: "POST",
  //       body: { title, content },
  //     })
  //   ).document,
  // update: (id: string, patch: { title?: string; content?: string }) =>
  //   request<{ document: DocFull }>(`/api/documents/${encodeURIComponent(id)}`, {
  //     method: "PATCH",
  //     body: patch,
  //   }),
  create: async (title?: string) =>
    (
      await request<{ document: DocFull }>("/api/documents", {
        method: "POST",
        body: { title, html: "" },
      })
    ).document,
  update: (id: string, patch: { title?: string; html?: string }) =>
    request<{ document: DocFull }>(`/api/documents/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: patch,
    }),
  remove: (id: string) =>
    request<{ deleted: boolean }>(`/api/documents/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

export const calendarApi = {
  list: async (range: { from: Date; to: Date }, signal?: AbortSignal) => {
    const q = new URLSearchParams({
      from: range.from.toISOString(),
      to: range.to.toISOString(),
    });
    return (
      await request<{ events: CalendarEvent[] }>(`/api/calendar/events?${q}`, {
        signal,
      })
    ).events;
  },
  create: async (body: EventPayload) =>
    (
      await request<{ event: CalendarEvent }>("/api/calendar/events", {
        method: "POST",
        body,
      })
    ).event,
  update: async (id: string, body: EventPayload) =>
    (
      await request<{ event: CalendarEvent }>(
        `/api/calendar/events/${encodeURIComponent(id)}`,
        { method: "PUT", body },
      )
    ).event,
  remove: (id: string) =>
    request<{ deleted: boolean }>(
      `/api/calendar/events/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    ),
};

export const tasksApi = {
  list: async (signal?: AbortSignal) =>
    (await request<{ tasks: TaskItem[] }>("/api/tasks", { signal })).tasks,
  create: async (body: {
    title: string;
    notes?: string | null;
    due?: string | null;
    remindDays?: number | null;
  }) =>
    (await request<{ task: TaskItem }>("/api/tasks", { method: "POST", body }))
      .task,
  update: async (
    id: string,
    patch: Partial<Pick<TaskItem, "title" | "notes" | "due" | "completed">>,
  ) =>
    (
      await request<{ task: TaskItem }>(
        `/api/tasks/${encodeURIComponent(id)}`,
        { method: "PATCH", body: patch },
      )
    ).task,
  remove: (id: string) =>
    request<{ deleted: boolean }>(`/api/tasks/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }),
};

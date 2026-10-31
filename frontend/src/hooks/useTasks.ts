import { useCallback } from "react";
import { tasksApi } from "../api/workspace.api";
import type { TaskItem } from "../types/calendar";
import { useResource } from "./useResource";

const EMPTY: TaskItem[] = [];

export function useTasks() {
  const { status, data, refetch, mutate } = useResource(
    (s) => tasksApi.list(s),
    EMPTY,
  );

  const add = useCallback(
    async (input: {
      title: string;
      notes?: string | null;
      due?: string | null;
      remindDays?: number | null;
    }) => {
      const task = await tasksApi.create(input);
      mutate((list) => [task, ...list]);
    },
    [mutate],
  );

  const toggle = useCallback(
    async (id: string) => {
      const current = data.find((t) => t.id === id);
      if (!current) return;
      const next = !current.completed;
      mutate((list) =>
        list.map((t) => (t.id === id ? { ...t, completed: next } : t)),
      );
      try {
        await tasksApi.update(id, { completed: next });
      } catch {
        mutate((list) =>
          list.map((t) => (t.id === id ? { ...t, completed: !next } : t)),
        ); // roll back
      }
    },
    [data, mutate],
  );

  const remove = useCallback(
    async (id: string) => {
      await tasksApi.remove(id);
      mutate((list) => list.filter((t) => t.id !== id));
    },
    [mutate],
  );

  return { status, tasks: data, refetch, add, toggle, remove };
}

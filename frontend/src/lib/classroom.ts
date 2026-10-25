import type { Coursework } from "../types/classroom";
import { isPast } from "./dates";

export function statusOf(w: Coursework): { label: string; done: boolean } {
  if (w.submission === "TURNED_IN")
    return { label: w.late ? "Turned in late" : "Turned in", done: true };
  if (w.submission === "RETURNED")
    return { label: w.late ? "Returned, late" : "Returned", done: true };
  if (isPast(w.due)) return { label: "Overdue", done: false };
  return { label: "To do", done: false };
}

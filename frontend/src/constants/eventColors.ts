import type { EventColor } from "../types/calendar";

export const eventColors: Record<
  EventColor,
  { label: string; dot: string; chip: string }
> = {
  zinc: {
    label: "Gray",
    dot: "bg-zinc-500",
    chip: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
  },
  red: {
    label: "Red",
    dot: "bg-red-500",
    chip: "bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200",
  },
  orange: {
    label: "Orange",
    dot: "bg-orange-500",
    chip: "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-200",
  },
  amber: {
    label: "Yellow",
    dot: "bg-amber-500",
    chip: "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
  },
  green: {
    label: "Green",
    dot: "bg-green-500",
    chip: "bg-green-100 text-green-900 dark:bg-green-950 dark:text-green-200",
  },
  teal: {
    label: "Teal",
    dot: "bg-teal-500",
    chip: "bg-teal-100 text-teal-900 dark:bg-teal-950 dark:text-teal-200",
  },
  blue: {
    label: "Blue",
    dot: "bg-blue-500",
    chip: "bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200",
  },
  violet: {
    label: "Violet",
    dot: "bg-violet-500",
    chip: "bg-violet-100 text-violet-900 dark:bg-violet-950 dark:text-violet-200",
  },
  pink: {
    label: "Pink",
    dot: "bg-pink-500",
    chip: "bg-pink-100 text-pink-900 dark:bg-pink-950 dark:text-pink-200",
  },
};

export const eventColorList = Object.keys(eventColors) as EventColor[];

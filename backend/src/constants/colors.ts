export const EVENT_COLORS = [
  "zinc",
  "red",
  "orange",
  "amber",
  "green",
  "teal",
  "blue",
  "violet",
  "pink",
] as const;
export type EventColor = (typeof EVENT_COLORS)[number];

import { randomUUID } from "node:crypto";
import { tool } from "@langchain/core/tools";
import { and, eq, gte, lte } from "drizzle-orm";
import { z } from "zod";
import { EVENT_COLORS } from "../constants/colors.js";
import { db } from "../db/index.js";
import { calendarEvents } from "../db/schema.js";
import { isoToZoned, zonedToUtcIso } from "../utils/time.js";
import { runTool, ToolError, type ToolDef } from "./_shared.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY = 86_400_000;

export const calendarTools: ToolDef[] = [
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ from, to }) =>
          runTool(async () => {
            const start = from ? new Date(from) : new Date();
            const end = to ? new Date(to) : new Date(start.getTime() + 7 * DAY);
            if (isNaN(start.getTime()) || isNaN(end.getTime()))
              throw new ToolError("Invalid date range.");

            // all-day rows hold plain dates, so compare them as dates too
            const rows = await db
              .select()
              .from(calendarEvents)
              .where(
                and(
                  eq(calendarEvents.userId, ctx.userId),
                  lte(calendarEvents.startAt, end.toISOString()),
                  gte(calendarEvents.endAt, start.toISOString().slice(0, 10)),
                ),
              )
              .limit(100);

            return {
              time_zone: ctx.timeZone,
              events: rows.map((e) => ({
                id: e.id,
                title: e.title,
                all_day: e.allDay,
                start: e.allDay
                  ? e.startAt
                  : isoToZoned(e.startAt, ctx.timeZone),
                end: e.allDay ? e.endAt : isoToZoned(e.endAt, ctx.timeZone),
              })),
            };
          }),
        {
          name: "calendar_list_events",
          description:
            "List events on the student's in-app calendar in a range (default: next 7 days). Times are in the student's time zone.",
          schema: z.object({
            from: z
              .string()
              .optional()
              .describe(
                "ISO date-time with offset, e.g. 2026-10-27T00:00:00+08:00",
              ),
            to: z.string().optional().describe("ISO date-time with offset"),
          }),
        },
      ),
  },
  {
    appId: null,
    build: (ctx) =>
      tool(
        async ({ events }) =>
          runTool(async () => {
            if (!events.length || events.length > 20)
              throw new ToolError("Provide 1 to 20 events.");

            const rows = events.map((e: any) => {
              const allDay = !!e.all_day;
              let startAt: string | null;
              let endAt: string | null;
              if (allDay) {
                startAt = DATE.test(e.start.slice(0, 10))
                  ? e.start.slice(0, 10)
                  : null;
                endAt = DATE.test(e.end.slice(0, 10))
                  ? e.end.slice(0, 10)
                  : startAt;
              } else {
                startAt = zonedToUtcIso(e.start, ctx.timeZone);
                endAt = zonedToUtcIso(e.end, ctx.timeZone);
              }
              if (!startAt || !endAt || endAt < startAt)
                throw new ToolError(
                  `Invalid time for "${e.title}". Use YYYY-MM-DDTHH:mm, with the end after the start.`,
                );
              return {
                id: randomUUID(),
                userId: ctx.userId,
                title: e.title.slice(0, 255),
                description: e.description?.slice(0, 2000) ?? null,
                startAt,
                endAt,
                allDay,
                color: e.color ?? "blue",
                source: "lumi" as const,
              };
            });

            await db.insert(calendarEvents).values(rows);
            return {
              time_zone: ctx.timeZone,
              created: rows.map((r: any) => ({
                id: r.id,
                title: r.title,
                start: r.allDay
                  ? r.startAt
                  : isoToZoned(r.startAt, ctx.timeZone),
              })),
            };
          }),
        {
          name: "calendar_create_events",
          description:
            "Add events (for example study sessions) to the student's in-app calendar. Times are local, in the student's time zone.",
          schema: z.object({
            events: z.array(
              z.object({
                title: z.string(),
                start: z
                  .string()
                  .describe(
                    "Local date-time YYYY-MM-DDTHH:mm, or YYYY-MM-DD when all_day",
                  ),
                end: z
                  .string()
                  .describe(
                    "Local date-time YYYY-MM-DDTHH:mm, or YYYY-MM-DD (inclusive) when all_day",
                  ),
                all_day: z.boolean().optional(),
                description: z.string().optional(),
                color: z
                  .enum(EVENT_COLORS)
                  .optional()
                  .describe("Use a different color per subject when it helps"),
              }),
            ),
          }),
        },
      ),
  },
];

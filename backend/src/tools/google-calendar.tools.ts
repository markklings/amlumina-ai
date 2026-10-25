import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service.js";
import { accountField, runTool, ToolError, type ToolDef } from "./_shared.js";

const APP_ID = 5;

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return { calendar: google.calendar({ version: "v3", auth }), accountEmail };
}

const toDate = (s: string | undefined, fallback: Date) => {
  if (!s) return fallback;
  const d = new Date(s);
  if (isNaN(d.getTime())) throw new ToolError(`Invalid date: ${s}`);
  return d;
};

export const calendarTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ from, to, account }) =>
          runTool(async () => {
            const { calendar, accountEmail } = await api(ctx.userId, account);
            const start = toDate(from, new Date());
            const end = toDate(to, new Date(start.getTime() + 7 * 86_400_000));
            const r = await calendar.events.list({
              calendarId: "primary",
              timeMin: start.toISOString(),
              timeMax: end.toISOString(),
              singleEvents: true,
              orderBy: "startTime",
              maxResults: 25,
            });
            return {
              account: accountEmail,
              events: (r.data.items ?? []).map((e) => ({
                id: e.id,
                title: e.summary,
                start: e.start?.dateTime ?? e.start?.date,
                end: e.end?.dateTime ?? e.end?.date,
                location: e.location,
                link: e.htmlLink,
              })),
            };
          }),
        {
          name: "google_calendar_list_events",
          description:
            "List calendar events in a time range (defaults to the next 7 days).",
          schema: z.object({
            from: z
              .string()
              .optional()
              .describe(
                "ISO date-time with offset, e.g. 2026-10-19T00:00:00+08:00",
              ),
            to: z.string().optional().describe("ISO date-time with offset"),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ events, account }) =>
          runTool(async () => {
            if (!events.length || events.length > 20)
              throw new ToolError("Provide 1 to 20 events.");
            const { calendar, accountEmail } = await api(ctx.userId, account);
            const created = [];
            for (const e of events) {
              const r = await calendar.events.insert({
                calendarId: "primary",
                requestBody: {
                  summary: e.title,
                  description: e.description,
                  location: e.location,
                  start: { dateTime: e.start, timeZone: ctx.timeZone },
                  end: { dateTime: e.end, timeZone: ctx.timeZone },
                  recurrence: e.recurrence ? [e.recurrence] : undefined,
                  extendedProperties: { private: { source: "lumi" } },
                },
              });
              created.push({
                id: r.data.id,
                title: r.data.summary,
                start: e.start,
                link: r.data.htmlLink,
              });
            }
            return { account: accountEmail, time_zone: ctx.timeZone, created };
          }),
        {
          name: "google_calendar_create_events",
          description:
            "Create one or more calendar events, e.g. study sessions of a study plan. Times are in the student's local time zone.",
          schema: z.object({
            events: z.array(
              z.object({
                title: z.string(),
                start: z
                  .string()
                  .describe(
                    "Local date-time without offset: YYYY-MM-DDTHH:mm:ss",
                  ),
                end: z
                  .string()
                  .describe(
                    "Local date-time without offset: YYYY-MM-DDTHH:mm:ss",
                  ),
                description: z.string().optional(),
                location: z.string().optional(),
                recurrence: z
                  .string()
                  .optional()
                  .describe('Optional RRULE, e.g. "RRULE:FREQ=WEEKLY;COUNT=4"'),
              }),
            ),
            account: accountField,
          }),
        },
      ),
  },
];

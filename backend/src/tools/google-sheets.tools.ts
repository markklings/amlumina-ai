import { google } from "googleapis";
import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { getGoogleAuth } from "../services/google-auth.service.js";
import { accountField, runTool, ToolError, type ToolDef } from "./_shared.js";
import { recordLibraryItem } from "../services/library.service.js";

const APP_ID = 4;

async function api(userId: string, account?: string) {
  const { auth, accountEmail } = await getGoogleAuth(userId, APP_ID, account);
  return { sheets: google.sheets({ version: "v4", auth }), accountEmail };
}

const normalize = (rows: string[][]) =>
  rows.map((r) =>
    r.map((c) => (/^true$/i.test(c) ? true : /^false$/i.test(c) ? false : c)),
  );

export const sheetsTools: ToolDef[] = [
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ title, items, account }) =>
          runTool(async () => {
            if (!items.length || items.length > 100)
              throw new ToolError("Provide 1 to 100 checklist items.");
            const { sheets, accountEmail } = await api(ctx.userId, account);
            const created = await sheets.spreadsheets.create({
              requestBody: {
                properties: { title },
                sheets: [
                  {
                    properties: {
                      title: "Checklist",
                      gridProperties: { frozenRowCount: 1 },
                    },
                  },
                ],
              },
            });
            const id = created.data.spreadsheetId!;
            const sheetId = created.data.sheets?.[0]?.properties?.sheetId ?? 0;
            const n = items.length;

            await sheets.spreadsheets.values.update({
              spreadsheetId: id,
              range: `Checklist!A1:D${n + 1}`,
              valueInputOption: "RAW",
              requestBody: {
                values: [
                  ["Done", "Task", "Due", "Notes"],
                  ...items.map((i: any) => [
                    false,
                    i.task,
                    i.due ?? "",
                    i.notes ?? "",
                  ]),
                ],
              },
            });
            await sheets.spreadsheets.batchUpdate({
              spreadsheetId: id,
              requestBody: {
                requests: [
                  {
                    setDataValidation: {
                      range: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex: n + 1,
                        startColumnIndex: 0,
                        endColumnIndex: 1,
                      },
                      rule: { condition: { type: "BOOLEAN" }, strict: true },
                    },
                  },
                  {
                    repeatCell: {
                      range: { sheetId, startRowIndex: 0, endRowIndex: 1 },
                      cell: {
                        userEnteredFormat: { textFormat: { bold: true } },
                      },
                      fields: "userEnteredFormat.textFormat.bold",
                    },
                  },
                ],
              },
            });
            const link = `https://docs.google.com/spreadsheets/d/${id}/edit`;
            await recordLibraryItem({
              userId: ctx.userId,
              kind: "sheet",
              title,
              fileId: id,
              account: accountEmail,
              link,
            });
            return { account: accountEmail, spreadsheet_id: id, link };
          }),
        {
          name: "google_sheets_create_checklist",
          description:
            "Create a Google Sheet study checklist with a checkbox column (Done | Task | Due | Notes).",
          schema: z.object({
            title: z.string(),
            items: z.array(
              z.object({
                task: z.string(),
                due: z.string().optional(),
                notes: z.string().optional(),
              }),
            ),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ spreadsheet_id, range, account }) =>
          runTool(async () => {
            const { sheets, accountEmail } = await api(ctx.userId, account);
            const r = await sheets.spreadsheets.values.get({
              spreadsheetId: spreadsheet_id,
              range: range ?? "A1:Z100",
            });
            return {
              account: accountEmail,
              range: r.data.range,
              values: r.data.values ?? [],
            };
          }),
        {
          name: "google_sheets_read_range",
          description:
            "Read cell values from a Google Sheet range (A1 notation, e.g. Checklist!A1:D20). Defaults to A1:Z100.",
          schema: z.object({
            spreadsheet_id: z.string(),
            range: z.string().optional(),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ spreadsheet_id, range, values, account }) =>
          runTool(async () => {
            const { sheets, accountEmail } = await api(ctx.userId, account);
            const r = await sheets.spreadsheets.values.update({
              spreadsheetId: spreadsheet_id,
              range,
              valueInputOption: "RAW",
              requestBody: { values: normalize(values) },
            });
            return {
              account: accountEmail,
              updated_cells: r.data.updatedCells,
            };
          }),
        {
          name: "google_sheets_update_cells",
          description:
            "Overwrite cells in a range, e.g. tick checklist items with TRUE/FALSE. values is a 2D array of rows.",
          schema: z.object({
            spreadsheet_id: z.string(),
            range: z.string().describe("A1 notation, e.g. Checklist!A2:A2"),
            values: z.array(z.array(z.string())),
            account: accountField,
          }),
        },
      ),
  },
  {
    appId: APP_ID,
    build: (ctx) =>
      tool(
        async ({ spreadsheet_id, range, values, account }) =>
          runTool(async () => {
            const { sheets, accountEmail } = await api(ctx.userId, account);
            const r = await sheets.spreadsheets.values.append({
              spreadsheetId: spreadsheet_id,
              range,
              valueInputOption: "RAW",
              insertDataOption: "INSERT_ROWS",
              requestBody: { values: normalize(values) },
            });
            return {
              account: accountEmail,
              updated_range: r.data.updates?.updatedRange,
            };
          }),
        {
          name: "google_sheets_append_rows",
          description:
            "Append rows after the last row of a sheet. For checklist sheets use columns Done (FALSE), Task, Due, Notes.",
          schema: z.object({
            spreadsheet_id: z.string(),
            range: z
              .string()
              .describe("Sheet name or range, e.g. Checklist!A:D"),
            values: z.array(z.array(z.string())),
            account: accountField,
          }),
        },
      ),
  },
];

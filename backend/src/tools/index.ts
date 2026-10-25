import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { connectedApps } from "../db/schema.js";
import type { ToolContext, ToolDef } from "./_shared.js";
import { webTools } from "./web.tools.js";
import { classroomTools } from "./google-classroom.tools.js";
import { driveTools } from "./google-drive.tools.js";
import { docsTools } from "./google-docs.tools.js";
import { sheetsTools } from "./google-sheets.tools.js";
import { calendarTools } from "./google-calendar.tools.js";
import { tasksTools } from "./google-tasks.tools.js";

const ALL: ToolDef[] = [
  ...webTools,
  ...classroomTools,
  ...driveTools,
  ...docsTools,
  ...sheetsTools,
  ...calendarTools,
  ...tasksTools,
];

export async function loadToolsForUser(userId: string, timeZone: string) {
  const rows = await db
    .select({
      email: connectedApps.accountEmail,
      type: connectedApps.accountType,
      apps: connectedApps.apps,
    })
    .from(connectedApps)
    .where(eq(connectedApps.userId, userId));

  const connected = new Set(rows.flatMap((r) => r.apps));
  const ctx: ToolContext = { userId, timeZone };
  const tools = ALL.filter(
    (t) => t.appId === null || connected.has(t.appId),
  ).map((t) => t.build(ctx));

  return { tools, accounts: rows };
}

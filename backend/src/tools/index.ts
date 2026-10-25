import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { connectedApps } from "../db/schema";
import type { ToolContext, ToolDef } from "./_shared";
import { webTools } from "./web.tools";
import { classroomTools } from "./google-classroom.tools";
import { driveTools } from "./google-drive.tools";
import { docsTools } from "./google-docs.tools";
import { sheetsTools } from "./google-sheets.tools";
import { calendarTools } from "./google-calendar.tools";
import { tasksTools } from "./google-tasks.tools";

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

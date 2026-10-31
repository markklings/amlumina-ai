import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { connectedApps } from "../db/schema.js";
import type { ToolContext, ToolDef } from "./_shared.js";
import { webTools } from "./web.tools.js";
import { classroomTools } from "./google-classroom.tools.js";
import { documentTools } from "./documents.tools.js";
import { calendarTools } from "./calendar.tools.js";
import { taskTools } from "./tasks.tools.js";
import { flashcardTools } from "./flashcards.tools.js";
import { quizTools } from "./quizzes.tools.js";

const ALL: ToolDef[] = [
  ...webTools,
  ...classroomTools,
  ...documentTools,
  ...calendarTools,
  ...taskTools,
  ...flashcardTools,
  ...quizTools,
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

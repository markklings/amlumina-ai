import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { connectedApps } from "../db/schema";
import { appsFromGrantedScopes } from "../constants/apps";

async function main() {
  const rows = await db.select().from(connectedApps);
  for (const r of rows) {
    const apps = appsFromGrantedScopes(r.scopes.join(" "));
    console.log(
      r.accountEmail.padEnd(32),
      JSON.stringify(r.apps),
      "→",
      JSON.stringify(apps),
    );
    await db
      .update(connectedApps)
      .set({ apps })
      .where(eq(connectedApps.id, r.id));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .then(() => process.exit(0));

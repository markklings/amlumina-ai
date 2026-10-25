import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { connectedApps } from "../db/schema";
import { decrypt, encrypt } from "../utils/crypto";
import { newOAuthClient } from "./google.service";
import { APPS } from "../constants/apps";
import { ToolError, AppNotConnectedError } from "../tools/_shared";

export async function getGoogleAuth(
  userId: string,
  appId: number,
  account?: string,
) {
  const appName = APPS.find((a) => a.id === appId)?.name ?? "this app";
  const rows = await db
    .select()
    .from(connectedApps)
    .where(eq(connectedApps.userId, userId));
  const candidates = rows.filter((r) => r.apps.includes(appId));

  if (!candidates.length) {
    throw new AppNotConnectedError(
      `${appName} is not connected. The student needs to connect a Google account with ${appName}.`,
    );
  }

  let row = candidates[0];
  if (account) {
    const found = candidates.find(
      (r) => r.accountEmail.toLowerCase() === account.toLowerCase(),
    );
    if (!found) {
      throw new ToolError(
        `Account ${account} has no access to ${appName}. Available: ${candidates.map((c) => c.accountEmail).join(", ")}`,
      );
    }
    row = found;
  } else {
    const prefer = appId === 1 ? "edu" : "personal";
    row = candidates.find((r) => r.accountType === prefer) ?? candidates[0];
  }

  let access: string | undefined;
  let refresh: string | undefined;
  try {
    access = row.accessTokenEncrypted
      ? decrypt(row.accessTokenEncrypted)
      : undefined;
    refresh = row.refreshTokenEncrypted
      ? decrypt(row.refreshTokenEncrypted)
      : undefined;
  } catch {
    throw new ToolError(
      "Stored Google tokens are unreadable. The student must reconnect this account.",
    );
  }
  if (!access && !refresh)
    throw new ToolError(
      "No Google tokens stored. The student must reconnect this account.",
    );

  const client = newOAuthClient();
  client.setCredentials({
    access_token: access,
    refresh_token: refresh,
    expiry_date: row.tokenExpiresAt?.getTime(),
  });

  client.on("tokens", (t) => {
    db.update(connectedApps)
      .set({
        ...(t.access_token
          ? { accessTokenEncrypted: encrypt(t.access_token) }
          : {}),
        ...(t.refresh_token
          ? { refreshTokenEncrypted: encrypt(t.refresh_token) }
          : {}),
        ...(t.expiry_date ? { tokenExpiresAt: new Date(t.expiry_date) } : {}),
      })
      .where(eq(connectedApps.id, row.id))
      .catch((e) => console.error("Failed to save refreshed Google token:", e));
  });

  return { auth: client, accountEmail: row.accountEmail, scopes: row.scopes };
}

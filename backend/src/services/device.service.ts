import type { Request } from "express";
import { and, eq } from "drizzle-orm";
import { db } from "../db/index";
import { knownDevices } from "../db/schema";
import { sha256 } from "../utils/crypto";

export async function checkDevice(
  userId: string,
  req: Request,
): Promise<boolean> {
  const fingerprint = sha256(req.headers["user-agent"] ?? "unknown");
  const rows = await db
    .select({ fp: knownDevices.fingerprint })
    .from(knownDevices)
    .where(eq(knownDevices.userId, userId));
  const seen = rows.some((r) => r.fp === fingerprint);

  if (seen) {
    await db
      .update(knownDevices)
      .set({ lastSeenAt: new Date() })
      .where(
        and(
          eq(knownDevices.userId, userId),
          eq(knownDevices.fingerprint, fingerprint),
        ),
      );
  } else {
    await db
      .insert(knownDevices)
      .values({ userId, fingerprint })
      .onDuplicateKeyUpdate({ set: { lastSeenAt: new Date() } });
  }
  return !seen && rows.length > 0;
}

export function describeDevice(ua?: string): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Chrome\//.test(ua)
        ? "Chrome"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Unknown browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad|iPod/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} on ${os}`;
}

import { db } from "../db/index.js";
import { libraryItems } from "../db/schema.js";

export async function recordLibraryItem(i: {
  userId: string;
  kind: "doc" | "sheet" | "folder";
  title: string;
  fileId: string;
  account: string;
  link: string;
}) {
  try {
    await db
      .insert(libraryItems)
      .values({
        userId: i.userId,
        kind: i.kind,
        title: i.title.slice(0, 255),
        googleFileId: i.fileId,
        accountEmail: i.account,
        link: i.link.slice(0, 1024),
      })
      .onDuplicateKeyUpdate({ set: { title: i.title.slice(0, 255) } });
  } catch (e) {
    console.error("Library record failed:", e instanceof Error ? e.message : e);
  }
}

import { Router } from "express";
import { desc, eq } from "drizzle-orm";
import { db } from "../db/index";
import { libraryItems } from "../db/schema";
import { requireAuth } from "../middleware/auth";
import { ok } from "../utils/response";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const rows = await db
      .select()
      .from(libraryItems)
      .where(eq(libraryItems.userId, req.userId!))
      .orderBy(desc(libraryItems.createdAt))
      .limit(200);

    return ok(res, {
      items: rows.map((r) => ({
        id: r.id,
        title: r.title,
        kind: r.kind,
        account: r.accountEmail,
        createdAt: r.createdAt.toISOString(),
        link: r.link,
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;

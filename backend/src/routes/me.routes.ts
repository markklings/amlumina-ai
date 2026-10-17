import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index";
import { users } from "../db/schema";
import { encrypt } from "../utils/crypto";
import { requireAuth } from "../middleware/auth";
import { ok, fail } from "../utils/response";

const router = Router();
router.use(requireAuth);

const keySchema = z.object({
    gemini_key: z.string().trim().min(20, "Invalid Gemini API key")
});

router.put("/gemini-key", async (req, res, next) => {
    try {
        const parsed = keySchema.safeParse(req.body);
        if (!parsed.success) {
            return fail(
                res,
                422,
                "VALIDATION_ERROR",
                "Invalid input",
                parsed.error.flatten().fieldErrors
            );
        }

        await db
            .update(users)
            .set({ geminiApiKeyEncrypted: encrypt(parsed.data.gemini_key) })
            .where(eq(users.id, req.userId!));

        return ok(res, { has_gemini_key: true });
    }
    catch (e) {
        next(e);
    }
});

export default router;

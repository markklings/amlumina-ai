import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  METHODS,
  METHOD_IDS,
  getMethod,
  publicMethod,
} from "../constants/methods.js";
import { requireAuth } from "../middleware/auth.js";
import { ok, fail } from "../utils/response.js";

const router = Router();
router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const [u] = await db
      .select({ learningMethodId: users.learningMethodId })
      .from(users)
      .where(eq(users.id, req.userId!))
      .limit(1);

    const selected = getMethod(u?.learningMethodId);
    return ok(res, {
      methods: METHODS.map(publicMethod),
      selected: selected ? publicMethod(selected) : null,
    });
  } catch (e) {
    next(e);
  }
});

const chooseSchema = z.object({
  method_id: z
    .number()
    .int()
    .refine((n) => METHOD_IDS.includes(n), "Unknown method id"),
});

router.post("/choose", async (req, res, next) => {
  try {
    const parsed = chooseSchema.safeParse(req.body);
    if (!parsed.success) {
      return fail(
        res,
        422,
        "VALIDATION_ERROR",
        "Invalid input",
        parsed.error.flatten().fieldErrors,
      );
    }

    await db
      .update(users)
      .set({ learningMethodId: parsed.data.method_id })
      .where(eq(users.id, req.userId!));
    return ok(res, {
      learning_method: publicMethod(getMethod(parsed.data.method_id)!),
    });
  } catch (e) {
    next(e);
  }
});

export default router;

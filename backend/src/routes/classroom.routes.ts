import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { ok } from "../utils/response";
import { respondGoogleError } from "../utils/googleErrors";
import { fetchClassroomOverview } from "../services/classroom.service";

const router = Router();
router.use(requireAuth);

router.get("/overview", async (req, res, next) => {
  try {
    const account =
      typeof req.query.account === "string" ? req.query.account : undefined;
    return ok(res, await fetchClassroomOverview(req.userId!, account));
  } catch (e) {
    if (!respondGoogleError(res, e)) next(e);
  }
});

export default router;

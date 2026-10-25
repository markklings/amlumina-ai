import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes.js";
import methodRoutes from "./routes/method.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import meRoutes from "./routes/me.routes.js";
import { fail } from "./utils/response.js";
import { verifyMailTransport } from "./services/mail.service.js";
import classroomRoutes from "./routes/classroom.routes.js";
import libraryRoutes from "./routes/library.routes.js";
import plannerRoutes from "./routes/planner.routes.js";
import { env } from "./config/env.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(
  cors({ origin: env.FRONTEND_URL.replace(/\/+$/, ""), credentials: false }),
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth/v1", authRoutes);
app.use("/api/method", methodRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/me", meRoutes);
app.use("/api/classroom", classroomRoutes);
app.use("/api/library", libraryRoutes);
app.use("/api/planner", plannerRoutes);

app.use((_req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  fail(res, 500, "INTERNAL_ERROR", "Something went wrong");
  void verifyMailTransport();
});

export default app;

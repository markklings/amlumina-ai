import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import helmet from "helmet";
import authRoutes from "./routes/auth.routes";
import methodRoutes from "./routes/method.routes";
import aiRoutes from "./routes/ai.routes";
import meRoutes from "./routes/me.routes";
import { fail } from "./utils/response";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: true, credentials: true })); // lock down origin in production
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/api/auth/v1", authRoutes);
app.use("/api/method", methodRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/me", meRoutes);


app.use((_req, res) => fail(res, 404, "NOT_FOUND", "Route not found"));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  fail(res, 500, "INTERNAL_ERROR", "Something went wrong");
});

export default app;

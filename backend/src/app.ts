import express, { type Request, type Response, type NextFunction } from "express";
import { router } from "./routes/index.ts";
import { globalLimiter } from "./middleware/rateLimit.ts";
import { config } from "./config.ts";

export function createApp() {
  const app = express();
  app.set("trust proxy", 1); // behind a host's proxy → correct client IP for rate limiting
  app.use(express.json({ limit: config.maxBodyBytes }));
  app.use(globalLimiter);
  app.use(router);

  // JSON 404
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: "not found" });
  });

  // JSON error handler (bad JSON body, etc.)
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    res.status(400).json({ error: err instanceof Error ? err.message : "bad request" });
  });

  return app;
}

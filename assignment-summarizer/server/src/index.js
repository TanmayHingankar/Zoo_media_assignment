import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { summarizeWithLLM } from "./llm.js";
import { validateInput } from "./validate.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const BODY_LIMIT = "10kb";
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 10);

function rateLimiter(req, res, next) {
  const store = rateLimiter.store || (rateLimiter.store = new Map());
  const ip = req.ip || req.connection?.remoteAddress || "anonymous";
  const now = Date.now();
  const entry = store.get(ip) || { count: 0, windowStart: now };
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.count = 0;
    entry.windowStart = now;
  }
  entry.count += 1;
  store.set(ip, entry);
  if (entry.count > RATE_LIMIT_MAX) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute.", type: "rate_limit" });
  }
  return next();
}

export function createApp(deps = { summarize: summarizeWithLLM, enableRateLimit: true }) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: BODY_LIMIT }));

  if (deps.enableRateLimit) {
    app.use(rateLimiter);
  }

  // Handle JSON parse errors and payload limits
  app.use((err, _req, res, next) => {
    if (err?.type === "entity.too.large") {
      return res.status(413).json({ error: "Request body too large", type: "validation" });
    }
    if (err instanceof SyntaxError && "body" in err) {
      return res.status(400).json({ error: "Invalid JSON payload", type: "validation" });
    }
    return next(err);
  });

  app.get("/", (_req, res) => {
    res.json({ status: "ok", message: "Summarizer API" });
  });

  app.post("/api/summarize", async (req, res) => {
    const validation = validateInput(req.body?.text);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error, type: "validation" });
    }

    try {
      const result = await deps.summarize(validation.value);
      return res.json(result);
    } catch (error) {
      const type = error.type || "api";
      const status = error.status || (type === "timeout" ? 500 : type === "validation" ? 400 : 500);
      const message = error.message || "Summarization failed";
      return res.status(status).json({ error: message, type });
    }
  });

  // Fallback error handler
  app.use((err, _req, res, _next) => {
    console.error("Unexpected error:", err);
    res.status(500).json({ error: "Unexpected server error", type: "api" });
  });

  return app;
}

if (process.env.NODE_ENV !== "test") {
  const app = createApp();
  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

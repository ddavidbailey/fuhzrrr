import express from "express";
import type { DbClient } from "../db/client.js";
import { findingsRouter } from "./routes/findings.js";
import { scoresRouter } from "./routes/scores.js";
import { runsRouter } from "./routes/runs.js";

export function createApp(db: DbClient): express.Express {
  const app = express();
  app.use(express.json());
  // Mounts routers for each API endpoint group
  app.use("/findings", findingsRouter(db));
  app.use("/scores", scoresRouter(db));
  app.use("/runs", runsRouter(db));
  return app;
}

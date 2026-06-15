import { Router } from "express";
import type { DbClient } from "../../db/client.js";
import { getLatestScore, listScoreHistory } from "../../db/repository.js";

export function scoresRouter(db: DbClient): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    const latest = getLatestScore(db);
    if (!latest) return res.status(404).json({ error: "No scores yet" });
    return res.json({
      composite: latest.composite,
      categories: {
        inputValidation: latest.inputValidation,
        authHardening: latest.authHardening,
        errorHygiene: latest.errorHygiene,
        resilience: latest.resilience,
        rateLimiting: latest.rateLimiting,
      },
      routeScores: JSON.parse(latest.routeScores),
      timestamp: latest.timestamp,
    });
  });

  router.get("/history", (_req, res) => {
    return res.json(
      listScoreHistory(db).map((s) => ({
        ...s,
        routeScores: JSON.parse(s.routeScores),
      })),
    );
  });

  return router;
}

import { Router } from "express";
import type { DbClient } from "../../db/client.js";
import { getFindingById, listFindings } from "../../db/repository.js";

export function findingsRouter(db: DbClient): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    return res.json(listFindings(db));
  });

  router.get("/:id", (req, res) => {
    const finding = getFindingById(db, req.params["id"]!);
    if (!finding) return res.status(404).json({ error: "Not found" });
    return res.json(finding);
  });

  return router;
}

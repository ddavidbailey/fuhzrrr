import { Router } from "express";
import type { DbClient } from "../../db/client.js";
import { listRuns } from "../../db/repository.js";

export function runsRouter(db: DbClient): Router {
  const router = Router();

  router.get("/", (_req, res) => {
    return res.json(listRuns(db));
  });

  return router;
}

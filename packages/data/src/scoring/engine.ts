import { randomUUID } from "node:crypto";
import type { DbClient } from "../db/client.js";
import { findings } from "../db/schema.js";
import { insertScore } from "../db/repository.js";
import { calculateCategoryScores, calculateComposite } from "./calculator.js";
import type { Severity } from "../types.js";

export function recalculateScores(db: DbClient, runId: string): void {
  const allFindings = db
    .select({
      mutationType: findings.mutationType,
      severity: findings.severity,
      endpoint: findings.endpoint,
      responseBody: findings.responseBody,
    })
    .from(findings)
    .all() as {
    mutationType: string;
    severity: Severity;
    endpoint: string;
    responseBody: string;
  }[];

  const categories = calculateCategoryScores(allFindings);
  const composite = calculateComposite(categories);

  const endpoints = [...new Set(allFindings.map((f) => f.endpoint))];
  const routeScores: Record<string, number> = {};
  for (const endpoint of endpoints) {
    const routeFindings = allFindings.filter((f) => f.endpoint === endpoint);
    routeScores[endpoint] = calculateComposite(
      calculateCategoryScores(routeFindings),
    );
  }

  insertScore(db, {
    id: randomUUID(),
    runId,
    timestamp: new Date(),
    composite,
    inputValidation: categories.inputValidation,
    authHardening: categories.authHardening,
    errorHygiene: categories.errorHygiene,
    resilience: categories.resilience,
    rateLimiting: categories.rateLimiting,
    routeScores: JSON.stringify(routeScores),
  });
}

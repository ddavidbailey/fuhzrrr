import { eq, desc, asc } from "drizzle-orm";
import type { DbClient } from "./client.js";
import { findings, runs, scores } from "./schema.js";
import type { InferInsertModel, InferSelectModel } from "drizzle-orm";

type NewFinding = InferInsertModel<typeof findings>;
type NewRun = InferInsertModel<typeof runs>;
type NewScore = InferInsertModel<typeof scores>;

export function insertRun(db: DbClient, run: NewRun): void {
  db.insert(runs).values(run).run();
}

export function listRuns(db: DbClient): InferSelectModel<typeof runs>[] {
  return db.select().from(runs).orderBy(desc(runs.startedAt)).all();
}

export function insertFinding(db: DbClient, finding: NewFinding): void {
  db.insert(findings).values(finding).run();
}

export function getFindingById(
  db: DbClient,
  id: string,
): InferSelectModel<typeof findings> | undefined {
  return db.select().from(findings).where(eq(findings.id, id)).get();
}

export function listFindings(
  db: DbClient,
): InferSelectModel<typeof findings>[] {
  let items: InferSelectModel<typeof findings>[] = db
    .select()
    .from(findings)
    .orderBy(desc(findings.timestamp))
    .all();
  return items;
}

export function insertScore(db: DbClient, score: NewScore): void {
  db.insert(scores).values(score).run();
}

export function getLatestScore(
  db: DbClient,
): InferSelectModel<typeof scores> | undefined {
  return db.select().from(scores).orderBy(desc(scores.timestamp)).get();
}

export function listScoreHistory(
  db: DbClient,
): InferSelectModel<typeof scores>[] {
  return db.select().from(scores).orderBy(asc(scores.timestamp)).all();
}

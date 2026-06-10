import { describe, it, expect, beforeEach } from "vitest";
import { createClient, type DbClient } from "../db/client.js";
import {
  insertRun,
  listRuns,
  insertFinding,
  getFindingById,
  listFindings,
  insertScore,
  getLatestScore,
  listScoreHistory,
} from "../db/repository.js";
import type { InferInsertModel } from "drizzle-orm";
import type { findings, runs, scores } from "../db/schema.js";

type NewFinding = InferInsertModel<typeof findings>;
type NewRun = InferInsertModel<typeof runs>;
type NewScore = InferInsertModel<typeof scores>;

let db: DbClient;

beforeEach(() => {
  db = createClient(":memory:");
});

const baseRun: NewRun = {}; // Empty run

const baseFinding: NewFinding = {
  id: "f1",
  runId: "r1",
  timestamp: new Date(),
  endpoint: "GET /api/users",
  mutationType: "tampered-jwt",
  statusCode: 200,
  latencyMs: 45,
  responseBody: '{"users":[]}',
  originalRequest: "{}",
  variantRequest: "{}",
  severity: "critical",
};

describe("runs", () => {
  it("inserts and lists runs", () => {
    insertRun(db, baseRun);
    expect(listRuns(db)).toHaveLength(1);
    expect(listRuns(db)[0]?.id).toEqual(expect.any(String));
  });
});

describe("findings", () => {
  it("inserts and retrieves a finding by id", () => {
    insertFinding(db, baseFinding);
    expect(getFindingById(db, "f1")?.id).toBe("f1");
    expect(getFindingById(db, "f1")?.severity).toBe("critical");
  });

  it("returns undefined for a missing id", () => {
    expect(getFindingById(db, "nope")).toBeUndefined();
  });

  it("lists findings with pagination", () => {
    insertFinding(db, { ...baseFinding, id: "f1" });
    insertFinding(db, { ...baseFinding, id: "f2" });
    insertFinding(db, { ...baseFinding, id: "f3" });
    const items = listFindings(db);
    expect(items).toHaveLength(3);
  });

  it("filters findings by severity", () => {
    insertFinding(db, { ...baseFinding, id: "f1", severity: "critical" });
    insertFinding(db, { ...baseFinding, id: "f2", severity: "low" });
    const items = listFindings(db);
    expect(items).toHaveLength(2);
  });
});

describe("scores", () => {
  it("inserts and retrieves the latest score", () => {
    const score: NewScore = {
      id: "s1",
      runId: "r1",
      timestamp: new Date(),
      composite: 85.5,
      inputValidation: 90,
      authHardening: 80,
      errorHygiene: 95,
      resilience: 75,
      rateLimiting: 88,
      routeScores: "{}",
    };
    insertScore(db, score);
    expect(getLatestScore(db)?.composite).toBe(85.5);
  });

  it("returns score history in ascending timestamp order", () => {
    const base = {
      runId: "r1",
      inputValidation: 90,
      authHardening: 80,
      errorHygiene: 95,
      resilience: 75,
      rateLimiting: 88,
      routeScores: "{}",
    };
    insertScore(db, {
      ...base,
      id: "s1",
      timestamp: new Date(0),
      composite: 80,
    });
    insertScore(db, {
      ...base,
      id: "s2",
      timestamp: new Date(1000),
      composite: 85,
    });
    const history = listScoreHistory(db);
    expect(history[0]?.timestamp).toEqual(new Date(0));
    expect(history[1]?.timestamp).toEqual(new Date(1000));
  });
});

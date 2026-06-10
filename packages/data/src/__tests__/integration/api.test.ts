import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../api/server.js";
import { createClient, type DbClient } from "../../db/client.js";
import { insertFinding, insertRun, insertScore } from "../../db/repository.js";
import type { InferInsertModel } from "drizzle-orm";
import type { findings, scores } from "../../db/schema.js";
import type express from "express";

let db: DbClient;
let app: express.Express;

beforeEach(() => {
  db = createClient(":memory:");
  app = createApp(db);
});

const baseFinding: InferInsertModel<typeof findings> = {
  id: "f1",
  runId: "r1",
  timestamp: new Date(),
  endpoint: "GET /api/users",
  mutationType: "tampered-jwt",
  statusCode: 200,
  latencyMs: 45,
  responseBody: "{}",
  originalRequest: "{}",
  variantRequest: "{}",
  severity: "critical",
};

describe("GET /findings", () => {
  it("returns empty list when no findings", async () => {
    const res = await request(app).get("/findings");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(res.body.length).toBe(0);
  });
});

describe("GET /findings/:id", () => {
  it("returns 404 for a missing finding", async () => {
    expect((await request(app).get("/findings/missing")).status).toBe(404);
  });

  it("returns full finding detail", async () => {
    insertFinding(db, baseFinding);
    const res = await request(app).get("/findings/f1");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("f1");
  });
});

describe("GET /scores", () => {
  it("returns 404 when no scores exist", async () => {
    expect((await request(app).get("/scores")).status).toBe(404);
  });

  it("returns the latest score snapshot", async () => {
    const score: InferInsertModel<typeof scores> = {
      id: "s1",
      runId: "r1",
      timestamp: new Date(),
      composite: 85,
      inputValidation: 90,
      authHardening: 80,
      errorHygiene: 95,
      resilience: 75,
      rateLimiting: 88,
      routeScores: "{}",
    };
    insertScore(db, score);
    const res = await request(app).get("/scores");
    expect(res.status).toBe(200);
    expect(res.body.composite).toBe(85);
  });
});

describe("GET /scores/history", () => {
  it("returns score history in chronological order", async () => {
    const base = {
      runId: "r1",
      inputValidation: 90,
      authHardening: 80,
      errorHygiene: 95,
      resilience: 75,
      rateLimiting: 88,
      routeScores: "{}",
    };
    insertScore(db, { ...base, id: "s1", composite: 80 });
    insertScore(db, { ...base, id: "s2", composite: 90 });
    const res = await request(app).get("/scores/history");
    expect(res.status).toBe(200);
    expect(res.body[0].composite).toBe(80);
    expect(res.body[1].composite).toBe(90);
  });
});

describe("GET /runs", () => {
  it("returns empty list when no runs", async () => {
    const res = await request(app).get("/runs");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("returns the run list", async () => {
    insertRun(db, { id: "r1", startedAt: new Date(1000) });
    const res = await request(app).get("/runs");
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
  });
});

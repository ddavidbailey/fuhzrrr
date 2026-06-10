import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import type { Severity } from "../types.js";
import { randomUUID } from "node:crypto";

export const runs = sqliteTable("runs", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  startedAt: integer("started_at", { mode: "timestamp" })
    .notNull()
    .$type<Date>() // Redundant since 'timestamp' already implies Date, just for clarity
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }).$type<Date>(), // $type<Date>() is redundant since 'timestamp' already implies Date, just for clarity
});

export const findings = sqliteTable("findings", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .$type<Date>() // Redundant since 'timestamp' already implies Date, just for clarity
    .$defaultFn(() => new Date()),
  endpoint: text("endpoint").notNull(),
  mutationType: text("mutation_type").notNull(),
  statusCode: integer("status_code").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  responseBody: text("response_body").notNull(),
  originalRequest: text("original_request").notNull(),
  variantRequest: text("variant_request").notNull(),
  severity: text("severity").$type<Severity>().notNull(),
});

export const scores = sqliteTable("scores", {
  id: text("id").primaryKey(),
  runId: text("run_id").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .$type<Date>() // Redundant since 'timestamp' already implies Date, just for clarity
    .$defaultFn(() => new Date()),
  composite: real("composite").notNull(),
  inputValidation: real("input_validation").notNull(),
  authHardening: real("auth_hardening").notNull(),
  errorHygiene: real("error_hygiene").notNull(),
  resilience: real("resilience").notNull(),
  rateLimiting: real("rate_limiting").notNull(),
  routeScores: text("route_scores").notNull(),
});

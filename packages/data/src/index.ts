import { createClient } from "./db/client.js";
import { createApp } from "./api/server.js";
import { createWsServer } from "./ws/server.js";
import { broadcast } from "./ws/broadcaster.js";
import { classifySeverity } from "./scoring/calculator.js";
import { recalculateScores } from "./scoring/engine.js";
import { insertFinding, insertRun, getLatestScore } from "./db/repository.js";
import { loadConfig } from "./config.js";
import { createLogger } from "./logger.js";
import type { FindingEvent, RunEvent } from "@api-shadow-fuzzer/types";

// Load and validate config from the JSON file specified by the DATA_CONFIG_PATH
// environment variable, falling back to data.config.json in the working directory
const configPath = "data.config.json";
const config = loadConfig(configPath);
const log = createLogger("index");
const db = createClient(config.dbPath);
const wss = createWsServer(config.wsPort);
const app = createApp(db);

export function startRun(event: RunEvent): void {
  insertRun(db, { id: event.runId, startedAt: event.timestamp });
  log.info({ runId: event.runId }, "run started");
  broadcast(wss, {
    type: "run_status",
    payload: { runId: event.runId, status: "started" },
  });
}

export function storeFinding(event: FindingEvent): void {
  const method = event.originalRequest.method.toUpperCase();
  const path = new URL(event.originalRequest.url, "http://localhost").pathname;
  const endpoint = `${method} ${path}`;

  const severity = classifySeverity(
    event.mutationType,
    event.statusCode,
    event.responseBody,
  );

  insertFinding(db, {
    id: event.id,
    runId: event.runId,
    // timestamp: adds new date when query is made
    endpoint,
    mutationType: event.mutationType,
    statusCode: event.statusCode,
    latencyMs: event.latencyMs,
    responseBody: event.responseBody,
    originalRequest: JSON.stringify({
      ...event.originalRequest,
      rawBody: event.originalRequest.rawBody.toString("base64"),
    }),
    variantRequest: JSON.stringify({
      ...event.variantRequest,
      rawBody: event.variantRequest.rawBody.toString("base64"),
    }),
    severity,
  });

  recalculateScores(db, event.runId);

  const latest = getLatestScore(db);
  broadcast(wss, {
    type: "finding",
    payload: {
      endpoint,
      mutationType: event.mutationType,
      severity,
      statusCode: event.statusCode,
    },
  });
  if (latest) broadcast(wss, { type: "score_update", payload: latest });
}

app.listen(config.httpPort, () => {
  log.info({ port: config.httpPort }, "HTTP API listening");
});

import type { WebSocketServer } from "ws";
import type { InferSelectModel } from "drizzle-orm";
import { scores } from "../db/schema.js";
import type { Severity } from "../types.js";

export interface FindingPayload {
  endpoint: string;
  mutationType: string;
  severity: Severity;
  statusCode: number;
}

export interface RunStatusPayload {
  runId: string;
  status: "started" | "completed";
}

export type ScorePayload = InferSelectModel<typeof scores>;

export type BroadcastEvent =
  | { type: "finding"; payload: FindingPayload }
  | { type: "score_update"; payload: ScorePayload }
  | { type: "run_status"; payload: RunStatusPayload };

export function broadcast(wss: WebSocketServer, event: BroadcastEvent): void {
  const message = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  }
}

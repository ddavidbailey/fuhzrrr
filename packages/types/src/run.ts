import { UUID } from "node:crypto";

export interface RunEvent {
  runId: UUID;
  timestamp: Date;
}

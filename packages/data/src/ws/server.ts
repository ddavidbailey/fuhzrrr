import { WebSocketServer } from "ws";
import type { Server } from "node:http";
import { createLogger } from "../logger.js";

const log = createLogger("ws");

// Attaches to the existing HTTP server so the dashboard connects over the same
// port as the REST API rather than a separate one.
export function createWsServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ server });
  wss.on("connection", () => log.info("dashboard client connected"));
  wss.on("error", (err) => log.error({ err }, "WebSocket server error"));
  return wss;
}

import type { Request } from "express";
import type { ClonedRequest } from "./types.js";

// Headers that only apply between two directly connected parties and must
// not be forwarded or included in fuzz variant requests
const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export function cloneRequest(req: Request, rawBody: Buffer): ClonedRequest {
  // Copy only non-hop-by-hop headers, and only string values
  // (Express can produce string[] for headers with multiple values)
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (!HOP_BY_HOP.has(key.toLowerCase()) && typeof value === "string") {
      headers[key] = value;
    }
  }

  return {
    method: req.method!,
    url: req.url!,
    headers,
    // Buffer.from() creates a new Buffer with copied bytes — not a reference
    rawBody: Buffer.from(rawBody),
    parsedBody: req.parsedBody,
    timestamp: Date.now(),
  };
}

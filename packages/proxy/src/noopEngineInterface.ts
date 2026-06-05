import type { FuzzingEngine } from "./fuzzingEngineInterface.js";
import type { ClonedRequest } from "./types.js";
import { logger } from "./logger.js";

// Stub engine used in Part 1 — receives cloned requests and discards them.
// Logs at debug level so you can confirm the middleware chain is working
// before the real engine exists.
export class NoopEngine implements FuzzingEngine {
  enqueue(cloned: ClonedRequest): void {
    logger.debug(
      { method: cloned.method, url: cloned.url },
      "noop engine: received cloned request",
    );
  }
}

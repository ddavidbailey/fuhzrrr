import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { FuzzingEngine } from "./fuzzingEngineInterface.js";
import type { ProxyConfig } from "./config.js";
import { cloneRequest } from "./cloneRequest.js";
import { createLogger } from "./logger.js";

// Write methods are in scope for fuzzing but require the operator to have
// acknowledged the target database is disposable before they are enabled
const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const interceptMiddlewareLogger = createLogger("interceptMiddleware");

export function createInterceptMiddleware(
  engine: FuzzingEngine,
  config: ProxyConfig,
): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const isWrite = WRITE_METHODS.has(req.method);

    // Standard / aggressive levels include write methods, but only if the operator
    // has explicitly acknowledged the target database is disposable
    if (isWrite && (!config.writeGuardAck || config.level === "safe")) {
      interceptMiddlewareLogger.warn(
        { method: req.method, url: req.url },
        "write-method fuzzing skipped: either writeGuardAck is false or config level is safe",
      );
      next();
      return;
    }

    // Clone the request into a plain object the engine can safely mutate
    const cloned = cloneRequest(req, req.rawBody ?? Buffer.alloc(0));

    // Hand the clone to the engine asynchronously — setImmediate defers this
    // until after the current call stack clears, meaning next() returns first
    // and the real response is never delayed by fuzzing work
    setImmediate(() => engine.enqueue(cloned));

    next();
  };
}

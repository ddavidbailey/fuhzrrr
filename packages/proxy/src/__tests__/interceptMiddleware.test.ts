import { describe, it, expect, vi, beforeEach } from "vitest";
import { Readable } from "node:stream";
import type { Request, Response } from "express";
import type { FuzzingEngine } from "../fuzzingEngineInterface.js";
import type { ClonedRequest } from "../types.js";
import type { ProxyConfig } from "../config.js";
import { createInterceptMiddleware } from "../interceptMiddleware.js";

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function makeConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    targetUrl: "http://localhost:3000",
    proxyPort: 4000,
    level: "safe",
    writeGuardAck: false,
    ...overrides,
  };
}

function makeReq(method: string = "GET", body: string = "{}"): Request {
  const stream = Readable.from([Buffer.from(body)]);
  return Object.assign(stream, {
    method,
    url: "/api/test",
    headers: { "content-type": "application/json" },
    rawBody: Buffer.from(body),
    parsedBody: JSON.parse(body),
  }) as unknown as Request;
}

describe("createInterceptMiddleware", () => {
  let engine: { enqueue: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    engine = { enqueue: vi.fn() };
  });

  it("calls next() synchronously before the engine processes", () => {
    const middleware = createInterceptMiddleware(
      engine as FuzzingEngine,
      makeConfig(),
    );
    const next = vi.fn();
    middleware(makeReq(), {} as Response, next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("hands the clone to the engine asynchronously for GET requests", async () => {
    const middleware = createInterceptMiddleware(
      engine as FuzzingEngine,
      makeConfig(),
    );
    middleware(makeReq("GET"), {} as Response, vi.fn());
    // engine should not have been called yet — setImmediate defers it
    expect(engine.enqueue).not.toHaveBeenCalled();
    await new Promise((resolve) => setImmediate(resolve));
    expect(engine.enqueue).toHaveBeenCalledOnce();
  });

  it("skips the engine for write methods when writeGuardAck is false", async () => {
    const middleware = createInterceptMiddleware(
      engine as FuzzingEngine,
      makeConfig({ writeGuardAck: false }),
    );
    for (const method of WRITE_METHODS) {
      engine.enqueue.mockClear();
      middleware(makeReq(method), {} as Response, vi.fn());
      await new Promise((resolve) => setImmediate(resolve));
      expect(engine.enqueue).not.toHaveBeenCalled();
    }
  });

  it("skips the engine for write methods when level is safe", async () => {
    const middleware = createInterceptMiddleware(
      engine as FuzzingEngine,
      // Test to see if the engine skips write when level is safe and writeGuardAck is true
      makeConfig({ level: "safe", writeGuardAck: true }),
    );
    for (const method of WRITE_METHODS) {
      engine.enqueue.mockClear();
      middleware(makeReq(method), {} as Response, vi.fn());
      await new Promise((resolve) => setImmediate(resolve));
      expect(engine.enqueue).not.toHaveBeenCalled();
    }
  });

  it("enqueues write methods when level is standard and writeGuardAck is true", async () => {
    const middleware = createInterceptMiddleware(
      engine as FuzzingEngine,
      makeConfig({ level: "standard", writeGuardAck: true }),
    );
    middleware(makeReq("POST", '{"name":"alice"}'), {} as Response, vi.fn());
    await new Promise((resolve) => setImmediate(resolve));
    expect(engine.enqueue).toHaveBeenCalledOnce();
    const cloned: ClonedRequest = engine.enqueue.mock.calls[0][0];
    expect(cloned.method).toBe("POST");
    expect(cloned.rawBody).toEqual(Buffer.from('{"name":"alice"}'));
  });
});

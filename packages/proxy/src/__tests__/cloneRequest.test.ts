import { describe, it, expect } from "vitest";
import type { Request } from "express";
import { cloneRequest } from "../cloneRequest.js";

function makeReq(overrides: Partial<Request> = {}): Request {
  return {
    method: "POST",
    url: "/api/users",
    headers: {
      "content-type": "application/json",
      authorization: "Bearer token123",
      connection: "keep-alive", // hop-by-hop — must be stripped
      "transfer-encoding": "chunked", // hop-by-hop — must be stripped
    },
    rawBody: Buffer.from('{"name":"alice"}'),
    parsedBody: { name: "alice" },
    ...overrides,
  } as unknown as Request;
}

describe("cloneRequest", () => {
  it("copies method and url from the original request", () => {
    const cloned = cloneRequest(makeReq(), Buffer.from('{"name":"alice"}'));
    expect(cloned.method).toBe("POST");
    expect(cloned.url).toBe("/api/users");
  });

  it("stores the exact raw bytes passed in", () => {
    const rawBody = Buffer.from('{"name":"alice"}');
    const cloned = cloneRequest(makeReq(), rawBody);
    expect(cloned.rawBody).toEqual(rawBody);
  });

  it("strips hop-by-hop headers", () => {
    const cloned = cloneRequest(makeReq(), Buffer.alloc(0));
    expect(cloned.headers["connection"]).toBeUndefined();
    expect(cloned.headers["transfer-encoding"]).toBeUndefined();
  });

  it("preserves non-hop-by-hop headers", () => {
    const cloned = cloneRequest(makeReq(), Buffer.alloc(0));
    expect(cloned.headers["content-type"]).toBe("application/json");
    expect(cloned.headers["authorization"]).toBe("Bearer token123");
  });

  it("returns a new object, not a reference to the original request", () => {
    const req = makeReq();
    const cloned = cloneRequest(req, req.rawBody);
    expect(cloned).not.toBe(req);
  });

  it("returns a copy of rawBody, not a reference to the original buffer", () => {
    const req = makeReq();
    const cloned = cloneRequest(req, req.rawBody);
    expect(cloned.rawBody).not.toBe(req.rawBody);
  });

  it("sets a timestamp close to the current time", () => {
    const before = Date.now();
    const cloned = cloneRequest(makeReq(), Buffer.alloc(0));
    expect(cloned.timestamp).toBeGreaterThanOrEqual(before);
    expect(cloned.timestamp).toBeLessThanOrEqual(Date.now() + 5);
  });
});

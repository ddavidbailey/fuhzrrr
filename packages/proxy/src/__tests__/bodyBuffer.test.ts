import { describe, it, expect, vi } from "vitest";
import { Readable } from "node:stream";
import type { Request, Response, NextFunction } from "express";
import { bufferBody } from "../bodyBuffer.js";

function makeReq(body: string, contentType = "application/json"): Request {
  const stream = Readable.from([Buffer.from(body)]);
  return Object.assign(stream, {
    headers: { "content-type": contentType },
    rawBody: undefined as unknown as Buffer,
    parsedBody: undefined,
  }) as unknown as Request;
}

describe("bufferBody", () => {
  it("stores the exact bytes in req.rawBody", async () => {
    const req = makeReq('{"hello":"world"}');
    const next = vi.fn();
    await new Promise<void>((resolve) => {
      bufferBody(req, {} as Response, (...args) => {
        next(...args);
        resolve();
      });
    });
    expect(next).toHaveBeenCalledWith();
    expect(req.rawBody).toEqual(Buffer.from('{"hello":"world"}'));
  });

  it("parses req.parsedBody for application/json", async () => {
    const req = makeReq('{"x":1}');
    await new Promise<void>((resolve) => {
      bufferBody(req, {} as Response, () => resolve());
    });
    expect(req.parsedBody).toEqual({ x: 1 });
  });

  it("leaves req.parsedBody undefined for non-JSON content types", async () => {
    const req = makeReq("rawbytes", "application/octet-stream");
    await new Promise<void>((resolve) => {
      bufferBody(req, {} as Response, () => resolve());
    });
    expect(req.parsedBody).toBeUndefined();
  });

  it("handles an empty body", async () => {
    const req = makeReq("");
    await new Promise<void>((resolve) => {
      bufferBody(req, {} as Response, () => resolve());
    });
    expect(req.rawBody).toEqual(Buffer.alloc(0));
    expect(req.parsedBody).toBeUndefined();
  });

  it("calls next() once after buffering is complete", async () => {
    const req = makeReq('{"done":true}');
    const next = vi.fn();
    await new Promise<void>((resolve) => {
      bufferBody(req, {} as Response, (...args) => {
        next(...args);
        resolve();
      });
    });
    expect(next).toHaveBeenCalledOnce();
  });
});

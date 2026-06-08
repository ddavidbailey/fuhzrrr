import type { Request, Response, NextFunction } from "express";

export function bufferBody(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Accumulate incoming stream chunks here — the body arrives in pieces, not all at once
  const chunks: Buffer[] = [];

  // Creates a listener on the request which listens for data chunks to arrive and pushes them onto the chunks array
  req.on("data", (chunk: Buffer) => chunks.push(chunk));

  /* Stream is fully received — join all pieces into one contiguous Buffer.
    This is stored on req.rawBody so the proxy can forward the exact original
    bytes to the upstream server without re-serializing or transforming them.
    */
  req.on("end", () => {
    req.rawBody = Buffer.concat(chunks);

    const contentType = req.headers["content-type"] ?? "";

    // For JSON requests, also parse a copy of the body into a plain object.
    // The fuzzing engine uses this to inspect and mutate fields without having
    // to parse the raw bytes itself. We only attempt this if the body is non-empty
    // — an empty JSON parse would throw.
    if (contentType.includes("application/json") && req.rawBody.length > 0) {
      try {
        req.parsedBody = JSON.parse(req.rawBody.toString("utf8"));
      } catch {
        // Body claimed to be JSON but wasn't valid — leave parsedBody undefined
        // and let the upstream server deal with it. We still forward the raw bytes.
        req.parsedBody = undefined;
      }
    }

    // Buffering complete — hand control to the next middleware in the chain
    next();
  });

  // If the stream errors (client disconnect, network issue), pass the error
  // to Express's error handler rather than leaving the request hanging
  req.on("error", next);
}

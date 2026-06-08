import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request, RequestHandler } from "express";
import type { ProxyConfig } from "./config.js";
import { createLogger } from "./logger.js";

const proxyMiddlewareLogger = createLogger("proxyMiddleware");

export function createForwardMiddleware(config: ProxyConfig): RequestHandler {
  return createProxyMiddleware({
    target: config.targetUrl,
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req: Request) => {
        // The request stream was already drained by bufferBody — re-write the
        // buffered bytes onto the outgoing request so the upstream server
        // receives the original body intact
        if (req.rawBody?.length) {
          proxyReq.setHeader("Content-Length", String(req.rawBody.length));
          proxyReq.write(req.rawBody);
        }
      },
      error: (err, _req, _res) => {
        // Log upstream connection failures without crashing the proxy process
        proxyMiddlewareLogger.error(
          { err },
          "proxy error: failed to reach upstream server",
        );
      },
    },
    logger: proxyMiddlewareLogger,
  });
}

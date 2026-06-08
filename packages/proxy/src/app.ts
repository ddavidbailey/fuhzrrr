import express, { type Express } from 'express';
import type { ProxyConfig } from './config.js';
import type { FuzzingEngine } from './fuzzingEngineInterface.js';
import { bufferBody } from './bodyBuffer.js';
import { createInterceptMiddleware } from './interceptMiddleware.js';
import { createForwardMiddleware } from './proxyMiddleware.js';

export function createApp(config: ProxyConfig, engine: FuzzingEngine): Express {
  const app = express();

  // Middleware order is critical:
  // 1. bufferBody   — must run first to drain the stream into req.rawBody
  // 2. intercept    — clones the buffered request and hands it to the engine
  // 3. proxy        — forwards the original bytes to the upstream server
  app.use(bufferBody);
  app.use(createInterceptMiddleware(engine, config));
  app.use(createForwardMiddleware(config));

  return app;
}

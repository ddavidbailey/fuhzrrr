import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import type { Server } from 'node:http';
import { startEchoServer, stopServer } from './echoServer.js';
import type { FuzzingEngine } from '../../fuzzingEngineInterface.js';
import type { ClonedRequest } from '../../types.js';
import type { ProxyConfig } from '../../config.js';
import { createApp } from '../../app.js';

const ECHO_PORT = 19001;
const PROXY_PORT = 19002;

function makeConfig(overrides: Partial<ProxyConfig> = {}): ProxyConfig {
  return {
    targetUrl: `http://localhost:${ECHO_PORT}`,
    proxyPort: PROXY_PORT,
    level: 'safe',
    writeGuardAck: true,
    ...overrides,
  };
}

let echoServer: Server;
let proxyServer: Server;
let enqueueSpy: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  // Start the echo server acting as the upstream dev server
  echoServer = await startEchoServer(ECHO_PORT);

  // Wire up the proxy with a spy engine so we can observe what gets enqueued
  enqueueSpy = vi.fn();
  const engine: FuzzingEngine = { enqueue: enqueueSpy };
  const app = createApp(makeConfig(), engine);

  await new Promise<void>((resolve) => {
    proxyServer = app.listen(PROXY_PORT, () => resolve());
  });
});

afterAll(async () => {
  await stopServer(proxyServer);
  await stopServer(echoServer);
});

describe('proxy integration', () => {
  it('forwards a GET request and returns the upstream response', async () => {
    const res = await fetch(`http://localhost:${PROXY_PORT}/api/health`);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body.method).toBe('GET');
    expect(body.url).toBe('/api/health');
  });

  it('forwards a POST request with the JSON body intact', async () => {
    const res = await fetch(`http://localhost:${PROXY_PORT}/api/users`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'alice', age: 30 }),
    });
    const body = await res.json();
    expect(body.method).toBe('POST');
    expect(JSON.parse(body.body)).toEqual({ name: 'alice', age: 30 });
  });

  it('calls engine.enqueue for each request', async () => {
    enqueueSpy.mockClear();
    await fetch(`http://localhost:${PROXY_PORT}/api/ping`);
    await new Promise(resolve => setTimeout(resolve, 20));
    expect(enqueueSpy).toHaveBeenCalledOnce();
    const cloned: ClonedRequest = enqueueSpy.mock.calls[0][0];
    expect(cloned.url).toBe('/api/ping');
  });

  it('does not block the real response while the engine processes', async () => {
    let engineCalled = false;
    const slowEngine: FuzzingEngine = {
      enqueue: () => {
        // Simulate slow engine work — should never delay the real response
        setTimeout(() => { engineCalled = true; }, 500);
      },
    };

    const app = createApp(makeConfig({ proxyPort: 19003 }), slowEngine);
    const server = await new Promise<Server>((resolve) => {
      const s = app.listen(19003, () => resolve(s));
    });

    const start = Date.now();
    await fetch('http://localhost:19003/api/test');
    const elapsed = Date.now() - start;

    expect(elapsed).toBeLessThan(200); // real response was not delayed
    expect(engineCalled).toBe(false);  // engine work hadn't fired yet

    await stopServer(server);
  });
});

import express from 'express';
import type { Server } from 'node:http';

// A minimal upstream server used as a test fixture — echoes back the
// method, URL, headers, and body of every request it receives as JSON.
// This gives integration tests a predictable upstream to assert against.
export function startEchoServer(port: number): Promise<Server> {
  const app = express();

  // Use raw body parsing so the body arrives as a Buffer regardless of content type
  app.use(express.raw({ type: '*/*' }));

  app.use((req, res) => {
    res.json({
      method: req.method,
      url: req.url,
      headers: req.headers,
      body: req.body instanceof Buffer ? req.body.toString('utf8') : '',
    });
  });

  return new Promise((resolve) => {
    const server = app.listen(port, () => resolve(server));
  });
}

export function stopServer(server: Server): Promise<void> {
  return new Promise((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve()))
  );
}

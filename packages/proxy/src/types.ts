import type { Request } from 'express';

export type FuzzLevel = 'safe' | 'standard' | 'aggressive';

export interface ClonedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  rawBody: Buffer;
  parsedBody: unknown;
  timestamp: number;
}

// SHARED: move to packages/types when packages/data/src imports this
export interface FindingEvent {
  id: string;
  timestamp: number;
  originalRequest: ClonedRequest;
  variantRequest: ClonedRequest;
  mutationType: string;
  statusCode: number;
  latencyMs: number;
  responseBody: string;
}

// Extend Express Request to carry buffered body fields
declare global {
  namespace Express {
    interface Request {
      rawBody: Buffer;
      parsedBody: unknown;
    }
  }
}

export type { ClonedRequest, FindingEvent } from '@api-shadow-fuzzer/types';

export type FuzzLevel = 'safe' | 'standard' | 'aggressive';

// Extend Express Request to carry buffered body fields
declare global {
  namespace Express {
    interface Request {
      rawBody: Buffer;
      parsedBody: unknown;
    }
  }
}

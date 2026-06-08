import type { ClonedRequest } from './types.js';

// The contract every engine must satisfy — Part 2 replaces NoopEngine
// with a real implementation of this interface, nothing else changes
export interface FuzzingEngine {
  enqueue(cloned: ClonedRequest): void;
}

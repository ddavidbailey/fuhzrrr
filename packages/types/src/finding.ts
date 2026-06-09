export interface ClonedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  rawBody: Buffer;
  parsedBody: unknown;
  timestamp: number;
}

export interface FindingEvent {
  id: string;
  runId: string;
  timestamp: number;
  originalRequest: ClonedRequest;
  variantRequest: ClonedRequest;
  mutationType: string;
  statusCode: number;
  latencyMs: number;
  responseBody: string;
}

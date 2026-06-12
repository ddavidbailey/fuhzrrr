import type { CategoryScores, Severity } from "../types.js";

export const WEIGHTS: CategoryScores = {
  inputValidation: 0.25,
  authHardening: 0.25,
  errorHygiene: 0.15,
  resilience: 0.2,
  rateLimiting: 0.15,
};

export const SEVERITY_PENALTY: Record<Severity, number> = {
  critical: 20,
  high: 10,
  medium: 5,
  low: 2,
  info: 0,
};

export const MUTATION_CATEGORY: Record<string, keyof CategoryScores> = {
  "type-coercion": "inputValidation",
  "missing-required-field": "inputValidation",
  "boundary-value": "inputValidation",
  "sql-injection": "inputValidation",
  "xss-payload": "inputValidation",
  "malformed-body": "inputValidation",
  "tampered-jwt": "authHardening",
  "missing-auth": "authHardening",
  "expired-token": "authHardening",
  "burst-request": "rateLimiting",
  "server-error": "resilience",
};

export const AUTH_MUTATIONS = new Set([
  "tampered-jwt",
  "missing-auth",
  "expired-token",
]);
export const INPUT_MUTATIONS = new Set([
  "type-coercion",
  "missing-required-field",
  "boundary-value",
  "sql-injection",
  "xss-payload",
  "malformed-body",
]);
export const STACK_TRACE_PATTERN = /at [A-Za-z]+[.\s]|Error:\s.+\n\s+at /;

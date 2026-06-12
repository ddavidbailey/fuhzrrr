import type { CategoryScores, Severity } from '../types.js';
import {
  WEIGHTS,
  SEVERITY_PENALTY,
  MUTATION_CATEGORY,
  AUTH_MUTATIONS,
  INPUT_MUTATIONS,
  STACK_TRACE_PATTERN,
} from './weights.js';

export function classifySeverity(
  mutationType: string,
  statusCode: number,
  responseBody: string,
): Severity {
  const is2xx = statusCode >= 200 && statusCode < 300;
  if (AUTH_MUTATIONS.has(mutationType) && is2xx) return 'critical';
  if (statusCode >= 500) return 'high';
  if (STACK_TRACE_PATTERN.test(responseBody)) return 'high';
  if (INPUT_MUTATIONS.has(mutationType) && is2xx) return 'high';
  if (mutationType === 'burst-request' && is2xx) return 'medium';
  return 'low';
}

export function calculateCategoryScores(
  findings: { mutationType: string; severity: Severity; responseBody: string }[],
): CategoryScores {
  const result: CategoryScores = {
    inputValidation: 100,
    authHardening: 100,
    errorHygiene: 100,
    resilience: 100,
    rateLimiting: 100,
  };

  for (const finding of findings) {
    const category = MUTATION_CATEGORY[finding.mutationType];
    if (category) {
      result[category] = Math.max(0, result[category] - SEVERITY_PENALTY[finding.severity]);
    }
    if (STACK_TRACE_PATTERN.test(finding.responseBody)) {
      result.errorHygiene = Math.max(0, result.errorHygiene - SEVERITY_PENALTY.high);
    }
  }

  return result;
}

export function calculateComposite(categories: CategoryScores): number {
  return (
    categories.inputValidation * WEIGHTS.inputValidation +
    categories.authHardening * WEIGHTS.authHardening +
    categories.errorHygiene * WEIGHTS.errorHygiene +
    categories.resilience * WEIGHTS.resilience +
    categories.rateLimiting * WEIGHTS.rateLimiting
  );
}

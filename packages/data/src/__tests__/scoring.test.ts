import { describe, it, expect } from 'vitest';
import {
  classifySeverity,
  calculateCategoryScores,
  calculateComposite,
} from '../scoring/calculator.js';
import { WEIGHTS } from '../scoring/weights.js';
import type { Severity } from '../types.js';

describe('WEIGHTS', () => {
  it('category weights sum to 1.0', () => {
    const total = Object.values(WEIGHTS).reduce((sum, w) => sum + w, 0);
    expect(total).toBeCloseTo(1.0);
  });
});

describe('classifySeverity', () => {
  it('auth bypass — tampered-jwt + 2xx → critical', () => {
    expect(classifySeverity('tampered-jwt', 200, '{}')).toBe('critical');
  });

  it('auth bypass — missing-auth + 201 → critical', () => {
    expect(classifySeverity('missing-auth', 201, '{}')).toBe('critical');
  });

  it('server crash — 500 → high', () => {
    expect(classifySeverity('missing-required-field', 500, 'Internal Server Error')).toBe('high');
  });

  it('stack trace in body → high', () => {
    const body = 'Error: something\n    at Object.<anonymous> (/app/index.js:10:5)';
    expect(classifySeverity('missing-required-field', 400, body)).toBe('high');
  });

  it('input validation bypass — type-coercion + 2xx → high', () => {
    expect(classifySeverity('type-coercion', 200, '{}')).toBe('high');
  });

  it('rate limit bypass — burst-request + 2xx → medium', () => {
    expect(classifySeverity('burst-request', 200, '{}')).toBe('medium');
  });

  it('anything else → low', () => {
    expect(classifySeverity('unknown-mutation', 400, '{}')).toBe('low');
  });
});

describe('calculateCategoryScores', () => {
  it('returns 100 for all categories with no findings', () => {
    const result = calculateCategoryScores([]);
    expect(result.inputValidation).toBe(100);
    expect(result.authHardening).toBe(100);
    expect(result.errorHygiene).toBe(100);
    expect(result.resilience).toBe(100);
    expect(result.rateLimiting).toBe(100);
  });

  it('deducts from the correct category for a critical auth finding', () => {
    const result = calculateCategoryScores([
      { mutationType: 'tampered-jwt', severity: 'critical' as Severity, responseBody: '{}' },
    ]);
    expect(result.authHardening).toBeLessThan(100);
    expect(result.inputValidation).toBe(100);
  });

  it('never goes below 0', () => {
    const findings = Array.from({ length: 20 }, () => ({
      mutationType: 'tampered-jwt',
      severity: 'critical' as Severity,
      responseBody: '{}',
    }));
    expect(calculateCategoryScores(findings).authHardening).toBe(0);
  });

  it('deducts from errorHygiene when a response leaks a stack trace', () => {
    const body = 'Error: something\n    at Object.<anonymous> (/app/index.js:10:5)';
    const result = calculateCategoryScores([
      { mutationType: 'missing-required-field', severity: 'high' as Severity, responseBody: body },
    ]);
    expect(result.errorHygiene).toBeLessThan(100);
  });

  it('leaves errorHygiene at 100 when no response leaks a stack trace', () => {
    const result = calculateCategoryScores([
      { mutationType: 'tampered-jwt', severity: 'critical' as Severity, responseBody: '{}' },
    ]);
    expect(result.errorHygiene).toBe(100);
  });
});

describe('calculateComposite', () => {
  it('returns 100 for all-perfect category scores', () => {
    expect(
      calculateComposite({ inputValidation: 100, authHardening: 100, errorHygiene: 100, resilience: 100, rateLimiting: 100 })
    ).toBeCloseTo(100);
  });

  it('applies weights correctly — inputValidation zeroed, rest perfect → 75', () => {
    expect(
      calculateComposite({ inputValidation: 0, authHardening: 100, errorHygiene: 100, resilience: 100, rateLimiting: 100 })
    ).toBeCloseTo(75);
  });
});

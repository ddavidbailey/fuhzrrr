export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface CategoryScores {
  inputValidation: number;
  authHardening: number;
  errorHygiene: number;
  resilience: number;
  rateLimiting: number;
}

export interface ScoreSnapshot {
  id: string;
  runId: string;
  timestamp: number;
  composite: number;
  categories: CategoryScores;
  routeScores: Record<string, number>;
}

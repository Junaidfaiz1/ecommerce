export * from './auth';
export * from './catalog';
export * from './compatibility';
export * from './builder';
export * from './performance';
export * from './account';
export * from './reviews';
export * from './compare';
export * from './three-d';
export * from './cart';
export * from './coupon';
export * from './checkout';
export * from './inventory';
export * from './orders';
export * from './admin';
export * from './email';
export * from './analytics';
export * from './security';
export * from './seo';

/** Stable API / GraphQL error codes — keep in sync with docs/error-handling.md */

export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'VALIDATION_FAILED',
  'CONFLICT',
  'INSUFFICIENT_STOCK',
  'INVALID_COUPON',
  'INCOMPATIBLE_BUILD',
  'PAYMENT_REQUIRED',
  'PAYMENT_FAILED',
  'RATE_LIMITED',
  'BAD_USER_INPUT',
  'INTERNAL',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export type HealthStatus = 'ok' | 'degraded' | 'down';

export interface ApiHealth {
  status: HealthStatus;
  service: 'vorqen';
  timestamp: string;
  database?: 'up' | 'down';
}

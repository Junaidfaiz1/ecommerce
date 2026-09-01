import type { ErrorCode } from '@vorqen/types';

/**
 * Domain errors thrown from services. GraphQL / HTTP layers map these to
 * stable `extensions.code` values — never leak stacks or Prisma messages.
 */
export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: ErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
    this.fields = fields;
  }
}

export class NotFoundError extends DomainError {
  constructor(message = 'Resource not found.', fields?: Record<string, string>) {
    super('NOT_FOUND', message, fields);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message = 'Validation failed.', fields?: Record<string, string>) {
    super('VALIDATION_FAILED', message, fields);
    this.name = 'ValidationError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

export class UnauthenticatedError extends DomainError {
  constructor(message = 'Authentication required.') {
    super('UNAUTHENTICATED', message);
    this.name = 'UnauthenticatedError';
  }
}

export class ConflictError extends DomainError {
  constructor(message = 'Conflict with current state.', fields?: Record<string, string>) {
    super('CONFLICT', message, fields);
    this.name = 'ConflictError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    message = 'Not enough stock for this item.',
    fields?: Record<string, string>,
  ) {
    super('INSUFFICIENT_STOCK', message, fields);
    this.name = 'InsufficientStockError';
  }
}

export class InvalidCouponError extends DomainError {
  constructor(
    message = 'This coupon cannot be applied.',
    fields?: Record<string, string>,
  ) {
    super('INVALID_COUPON', message, fields);
    this.name = 'InvalidCouponError';
  }
}

export class IncompatibleBuildError extends DomainError {
  constructor(
    message = 'This build has compatibility issues.',
    fields?: Record<string, string>,
  ) {
    super('INCOMPATIBLE_BUILD', message, fields);
    this.name = 'IncompatibleBuildError';
  }
}

export class PaymentFailedError extends DomainError {
  constructor(
    message = 'Payment failed. Please try again.',
    fields?: Record<string, string>,
  ) {
    super('PAYMENT_FAILED', message, fields);
    this.name = 'PaymentFailedError';
  }
}

export class RateLimitedError extends DomainError {
  readonly retryAfterMs: number;

  constructor(
    message = 'Too many requests. Please wait and try again.',
    retryAfterMs = 60_000,
  ) {
    super('RATE_LIMITED', message, {
      retryAfter: String(Math.ceil(retryAfterMs / 1000)),
    });
    this.name = 'RateLimitedError';
    this.retryAfterMs = retryAfterMs;
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}

import { NextResponse } from 'next/server';
import type { ErrorCode } from '@vorqen/types';
import { isDomainError } from './errors';
import { logger } from './logger';

const STATUS: Partial<Record<ErrorCode, number>> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 400,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  BAD_USER_INPUT: 400,
};

export function jsonDomainError(error: unknown): NextResponse {
  if (isDomainError(error)) {
    const status = STATUS[error.code] ?? 400;
    return NextResponse.json(
      { code: error.code, message: error.message },
      { status },
    );
  }
  logger.error('Unexpected HTTP error', {
    reason: error instanceof Error ? error.message : 'unknown',
  });
  return NextResponse.json(
    { code: 'INTERNAL', message: 'Something went wrong. Please try again.' },
    { status: 500 },
  );
}

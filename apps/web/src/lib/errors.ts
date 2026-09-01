import type { ErrorCode } from '@vorqen/types';

const MESSAGES: Partial<Record<ErrorCode, string>> = {
  UNAUTHENTICATED: 'Please sign in to continue.',
  FORBIDDEN: 'You do not have permission to do that.',
  NOT_FOUND: 'We could not find what you were looking for.',
  VALIDATION_FAILED: 'Please check the highlighted fields.',
  CONFLICT: 'That change conflicts with the current state.',
  INSUFFICIENT_STOCK: 'Not enough stock for this item.',
  INVALID_COUPON: 'This coupon cannot be applied.',
  INCOMPATIBLE_BUILD: 'This build has compatibility issues.',
  PAYMENT_REQUIRED: 'Payment is required to continue.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  RATE_LIMITED: 'Too many requests. Please wait and try again.',
  BAD_USER_INPUT: 'Invalid request.',
  INTERNAL: 'Something went wrong. Please try again.',
};

type GraphQLErrorLike = {
  message?: string;
  extensions?: {
    code?: string;
    fields?: Record<string, string>;
  };
};

/**
 * Map GraphQL / domain error codes to safe UI copy.
 * Prefer `extensions.code`; never dump raw internal messages for INTERNAL.
 */
export function getErrorMessage(
  error: unknown,
  fallback = MESSAGES.INTERNAL!,
): string {
  if (!error) return fallback;

  if (error instanceof Error && !('extensions' in error)) {
    return error.message.length < 200 ? error.message : fallback;
  }

  if (typeof error !== 'object') return fallback;

  const gql = error as GraphQLErrorLike;
  const code = gql.extensions?.code as ErrorCode | undefined;
  if (code && MESSAGES[code]) {
    if (
      (code === 'VALIDATION_FAILED' ||
        code === 'UNAUTHENTICATED' ||
        code === 'CONFLICT' ||
        code === 'INVALID_COUPON' ||
        code === 'INSUFFICIENT_STOCK' ||
        code === 'INCOMPATIBLE_BUILD' ||
        code === 'PAYMENT_FAILED') &&
      gql.message
    ) {
      return gql.message;
    }
    if (code !== 'INTERNAL') {
      return MESSAGES[code] ?? fallback;
    }
  }
  if (code === 'INTERNAL' || !code) {
    return fallback;
  }
  return gql.message && gql.message.length < 200 ? gql.message : fallback;
}

export function getErrorFields(
  error: GraphQLErrorLike | null | undefined,
): Record<string, string> | undefined {
  return error?.extensions?.fields;
}

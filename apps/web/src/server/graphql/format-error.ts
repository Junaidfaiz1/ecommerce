import { GraphQLError } from 'graphql';
import type { GraphQLFormattedError } from 'graphql';
import { isDomainError } from '../common/errors';
import { logger } from '../common/logger';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Yoga `maskedErrors.maskError` — expose DomainError codes safely;
 * everything else becomes INTERNAL.
 */
export function maskGraphQLError(
  error: unknown,
  message: string,
): GraphQLError {
  const original =
    error instanceof GraphQLError ? error.originalError : error instanceof Error ? error : undefined;

  if (isDomainError(original)) {
    return new GraphQLError(original.message, {
      extensions: {
        code: original.code,
        ...(original.fields ? { fields: original.fields } : {}),
      },
    });
  }

  if (error instanceof GraphQLError) {
    const code = error.extensions?.code;
    if (typeof code === 'string' && code !== 'INTERNAL_SERVER_ERROR') {
      return new GraphQLError(error.message, {
        nodes: error.nodes,
        source: error.source,
        positions: error.positions,
        path: error.path,
        extensions: {
          code,
          ...(error.extensions.fields ? { fields: error.extensions.fields } : {}),
          ...(typeof error.extensions.retryAfter === 'number'
            ? { retryAfter: error.extensions.retryAfter }
            : {}),
          ...(error.extensions.http ? { http: error.extensions.http } : {}),
        },
      });
    }
  }

  logger.error('Unhandled GraphQL error', {
    message: original?.message ?? message,
    name: original?.name,
  });

  return new GraphQLError(isDev ? (original?.message ?? message) : 'Something went wrong.', {
    extensions: {
      code: 'INTERNAL',
    },
  });
}

/** Optional helper for non-Yoga callers */
export function formatErrorForClient(error: GraphQLFormattedError): GraphQLFormattedError {
  const code =
    typeof error.extensions?.code === 'string' ? error.extensions.code : 'INTERNAL';
  return {
    message: error.message,
    locations: error.locations,
    path: error.path,
    extensions: {
      code,
      ...(error.extensions?.fields ? { fields: error.extensions.fields } : {}),
    },
  };
}

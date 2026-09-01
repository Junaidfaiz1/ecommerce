import type { ErrorCode } from '@vorqen/types';
import { getErrorMessage as mapDomainError } from '@/lib/errors';

const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? '/api/graphql';

type GqlError = {
  message?: string;
  extensions?: { code?: string; fields?: Record<string, string> };
};

export class GraphQLClientError extends Error {
  readonly code?: ErrorCode;
  readonly fields?: Record<string, string>;

  constructor(error: GqlError) {
    super(mapDomainError(error));
    this.name = 'GraphQLClientError';
    this.code = error.extensions?.code as ErrorCode | undefined;
    this.fields = error.extensions?.fields;
  }
}

export async function graphqlRequest<TData = Record<string, unknown>>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  let json: {
    data?: TData;
    errors?: GqlError[];
  };
  try {
    json = (await res.json()) as { data?: TData; errors?: GqlError[] };
  } catch {
    if (res.status === 429) {
      throw new GraphQLClientError({
        message: 'Too many requests. Please wait and try again.',
        extensions: { code: 'RATE_LIMITED' },
      });
    }
    throw new GraphQLClientError({
      message: 'Empty GraphQL response.',
      extensions: { code: 'INTERNAL' },
    });
  }

  if (res.status === 429 || json.errors?.some((e) => e.extensions?.code === 'RATE_LIMITED')) {
    throw new GraphQLClientError(
      json.errors?.[0] ?? {
        message: 'Too many requests. Please wait and try again.',
        extensions: { code: 'RATE_LIMITED' },
      },
    );
  }

  if (json.errors?.length) {
    throw new GraphQLClientError(json.errors[0]!);
  }

  if (!json.data) {
    throw new GraphQLClientError({
      message: 'Empty GraphQL response.',
      extensions: { code: 'INTERNAL' },
    });
  }

  return json.data;
}

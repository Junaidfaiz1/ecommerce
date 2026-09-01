import {
  Kind,
  GraphQLError,
  type DefinitionNode,
  type DocumentNode,
  type OperationDefinitionNode,
} from 'graphql';
import type { Plugin } from 'graphql-yoga';
import {
  GRAPHQL_HTTP_RATE_LIMIT,
  RATE_LIMIT_RULES,
  rateLimitBucketForFields,
  type RateLimitBucket,
  type RateLimitDecision,
} from '@vorqen/types';
import { clientIpFromRequest } from '../audit';
import type { GraphQLContext } from '../graphql/context';
import { consumeRateLimit } from './rate-limit';

function rateLimitHttp(decision: RateLimitDecision) {
  const retryAfter = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
  return {
    spec: true,
    status: 429,
    headers: {
      'Retry-After': String(retryAfter),
      'X-RateLimit-Limit': String(decision.limit),
      'X-RateLimit-Remaining': '0',
    },
  };
}

function graphqlErrorFromDecision(decision: RateLimitDecision): GraphQLError {
  const retryAfter = Math.max(1, Math.ceil(decision.retryAfterMs / 1000));
  return new GraphQLError('Too many requests. Please wait and try again.', {
    extensions: {
      code: 'RATE_LIMITED',
      retryAfter,
      http: rateLimitHttp(decision),
    },
  });
}

function deniedHttpResponse(
  fetchAPI: { Response: typeof Response },
  decision: RateLimitDecision,
): Response {
  const http = rateLimitHttp(decision);
  return new fetchAPI.Response(
    JSON.stringify({ errors: [graphqlErrorFromDecision(decision)] }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...http.headers,
      },
    },
  );
}

function topLevelFields(document: DocumentNode): {
  operationType: 'query' | 'mutation' | 'subscription';
  fields: string[];
} | null {
  const op = document.definitions.find(
    (def: DefinitionNode): def is OperationDefinitionNode =>
      def.kind === Kind.OPERATION_DEFINITION,
  );
  if (!op) return null;
  const fields: string[] = [];
  for (const sel of op.selectionSet.selections) {
    if (sel.kind === Kind.FIELD) fields.push(sel.name.value);
  }
  return { operationType: op.operation, fields };
}

function bucketKey(
  bucket: RateLimitBucket,
  ip: string,
  userId: string | null,
): string {
  if (bucket === 'checkout' && userId) return `checkout:user:${userId}`;
  if (bucket === 'auth') return `auth:ip:${ip}`;
  return `${bucket}:ip:${ip}`;
}

/**
 * HTTP + operation-level GraphQL rate limits (in-memory, no Redis).
 * Checkout keys use the authenticated user from server context — never client input.
 */
export function createRateLimitPlugin(): Plugin<GraphQLContext> {
  return {
    onRequest({ request, fetchAPI, endResponse }) {
      const ip = clientIpFromRequest(request) ?? 'unknown';
      const decision = consumeRateLimit(`http:ip:${ip}`, GRAPHQL_HTTP_RATE_LIMIT);
      if (!decision.allowed) {
        endResponse(deniedHttpResponse(fetchAPI, decision));
      }
    },
    onExecute({ args, setResultAndStopExecution }) {
      const parsed = topLevelFields(args.document);
      if (!parsed) return;

      const ctx = args.contextValue;
      const ip = clientIpFromRequest(ctx.request) ?? 'unknown';
      const bucket = rateLimitBucketForFields(parsed.operationType, parsed.fields);
      const decision = consumeRateLimit(
        bucketKey(bucket, ip, ctx.userId),
        RATE_LIMIT_RULES[bucket],
      );
      if (!decision.allowed) {
        setResultAndStopExecution({
          errors: [graphqlErrorFromDecision(decision)],
        });
      }
    },
  };
}

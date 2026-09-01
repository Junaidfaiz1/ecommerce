import { graphql, type GraphQLSchema } from 'graphql';
import type { PrismaClient } from '@/generated/prisma/client';
import type { AuthUser } from '../auth/types';
import type { GraphQLContext } from '../graphql/context';
import { schema } from '../graphql/schema';
import { maskGraphQLError } from '../graphql/format-error';

export function testContext(
  prisma: PrismaClient,
  user: AuthUser | null = null,
): GraphQLContext {
  return {
    prisma,
    userId: user?.id ?? null,
    user,
    cartSessionId: null,
    request: new Request('http://localhost:3000/api/graphql'),
  };
}

export async function executeGraphql(
  source: string,
  context: GraphQLContext,
  variableValues?: Record<string, unknown>,
  gqlSchema: GraphQLSchema = schema as unknown as GraphQLSchema,
) {
  const result = await graphql({
    schema: gqlSchema,
    source,
    contextValue: context,
    variableValues,
  });

  return {
    data: result.data,
    errors: result.errors?.map((error) => maskGraphQLError(error, error.message)),
  };
}

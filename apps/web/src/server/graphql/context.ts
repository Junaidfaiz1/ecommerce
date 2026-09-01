import type { YogaInitialContext } from 'graphql-yoga';
import type { PrismaClient } from '@/generated/prisma/client';
import { prisma } from '../common/prisma';
import {
  ACCESS_COOKIE,
  CART_SESSION_COOKIE,
  bearerFromAuthorization,
  parseCookieHeader,
} from '../auth/cookies';
import { verifyAccessToken } from '../auth/jwt';
import { loadAuthUser } from '../auth/auth.service';
import type { AuthUser } from '../auth/types';

export type GraphQLContext = {
  prisma: PrismaClient;
  userId: string | null;
  user: AuthUser | null;
  /** Guest cart session from httpOnly cookie. */
  cartSessionId: string | null;
  request: Request;
};

export async function createContext(
  initial: YogaInitialContext,
): Promise<GraphQLContext> {
  const request = initial.request;
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  const token =
    bearerFromAuthorization(authHeader) ??
    parseCookieHeader(cookieHeader, ACCESS_COOKIE);

  let userId: string | null = null;
  let user: AuthUser | null = null;

  if (token) {
    const claims = await verifyAccessToken(token);
    if (claims) {
      user = await loadAuthUser(prisma, claims.sub);
      userId = user?.id ?? null;
    }
  }

  const cartSessionId =
    parseCookieHeader(cookieHeader, CART_SESSION_COOKIE) ?? null;

  return {
    prisma,
    userId,
    user,
    cartSessionId,
    request,
  };
}

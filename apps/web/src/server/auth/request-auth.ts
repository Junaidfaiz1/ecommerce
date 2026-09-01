import { prisma } from '../common/prisma';
import {
  ACCESS_COOKIE,
  bearerFromAuthorization,
  parseCookieHeader,
} from './cookies';
import { verifyAccessToken } from './jwt';
import { loadAuthUser } from './auth.service';
import type { AuthUser } from './types';

export async function loadAuthUserFromRequest(
  request: Request,
): Promise<AuthUser | null> {
  const token =
    bearerFromAuthorization(request.headers.get('authorization')) ??
    parseCookieHeader(request.headers.get('cookie'), ACCESS_COOKIE);
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  return loadAuthUser(prisma, claims.sub);
}

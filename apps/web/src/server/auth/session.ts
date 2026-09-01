import type { UserRole } from '@vorqen/types';
import { readAccessCookie } from './cookies';
import { verifyAccessToken } from './jwt';

export type NavSession = {
  role: UserRole;
};

/** Cookie JWT only — for chrome (navbar/footer). Not a permissions check. */
export async function getNavSession(): Promise<NavSession | null> {
  const token = await readAccessCookie();
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  return { role: claims.role };
}

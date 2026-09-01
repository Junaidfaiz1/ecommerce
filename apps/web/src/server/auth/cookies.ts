import { cookies } from 'next/headers';

export const ACCESS_COOKIE = 'vorqen_access';
export const REFRESH_COOKIE = 'vorqen_refresh';
/** Anonymous cart identity until the shopper signs in. */
export const CART_SESSION_COOKIE = 'vorqen_cart_session';

const isProd = () => process.env.NODE_ENV === 'production';

const baseOptions = {
  httpOnly: true,
  secure: isProd(),
  sameSite: 'lax' as const,
  path: '/',
};

/** Access JWT — short-lived. */
export async function setAccessCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, token, {
    ...baseOptions,
    maxAge: 60 * 15,
  });
}

/** Refresh JWT — 7 days. */
export async function setRefreshCookie(token: string): Promise<void> {
  const jar = await cookies();
  jar.set(REFRESH_COOKIE, token, {
    ...baseOptions,
    maxAge: 60 * 60 * 24 * 7,
  });
}

/** Guest cart session — 30 days. */
export async function setCartSessionCookie(sessionId: string): Promise<void> {
  const jar = await cookies();
  jar.set(CART_SESSION_COOKIE, sessionId, {
    ...baseOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearCartSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CART_SESSION_COOKIE, '', { ...baseOptions, maxAge: 0 });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(ACCESS_COOKIE, '', { ...baseOptions, maxAge: 0 });
  jar.set(REFRESH_COOKIE, '', { ...baseOptions, maxAge: 0 });
}

export async function readAccessCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(ACCESS_COOKIE)?.value;
}

export async function readRefreshCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value;
}

export function parseCookieHeader(header: string | null, name: string): string | undefined {
  if (!header) return undefined;
  const parts = header.split(';');
  for (const part of parts) {
    const [rawKey, ...rest] = part.trim().split('=');
    if (rawKey === name) {
      return decodeURIComponent(rest.join('='));
    }
  }
  return undefined;
}

export function bearerFromAuthorization(header: string | null): string | undefined {
  if (!header) return undefined;
  const [scheme, token] = header.split(/\s+/);
  if (scheme?.toLowerCase() !== 'bearer' || !token) return undefined;
  return token;
}

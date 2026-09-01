import { isStaffRole } from '@vorqen/types';

/** Same-origin path only — blocks open redirects. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/login') || value.startsWith('/register')) return '/';
  return value;
}

/** After login/register: honor `next`, else send staff to ops. */
export function postAuthPath(
  next: string | null | undefined,
  role?: string | null,
): string {
  const path = safeNextPath(next);
  if (path !== '/') return path;
  return isStaffRole(role) ? '/admin' : '/';
}

export function loginHref(next?: string | null): string {
  const path = safeNextPath(next);
  if (path === '/') return '/login';
  return `/login?next=${encodeURIComponent(path)}`;
}

export function registerHref(next?: string | null): string {
  const path = safeNextPath(next);
  if (path === '/') return '/register';
  return `/register?next=${encodeURIComponent(path)}`;
}

/** Full navigation so Set-Cookie is visible to middleware on the next request. */
export function goAfterAuth(
  next: string | null | undefined,
  role?: string | null,
): void {
  window.location.assign(postAuthPath(next, role));
}

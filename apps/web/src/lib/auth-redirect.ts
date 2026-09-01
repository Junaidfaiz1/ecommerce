/** Same-origin path only — blocks open redirects. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/';
  if (value.startsWith('/login') || value.startsWith('/register')) return '/';
  return value;
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
export function goAfterAuth(next: string | null | undefined): void {
  window.location.assign(safeNextPath(next));
}

import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const ACCESS_COOKIE = 'vorqen_access';

function accessSecret(): Uint8Array | null {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) return null;
  return new TextEncoder().encode(value);
}

async function readAccessRole(request: NextRequest): Promise<string | null> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const secret = accessSecret();
  if (!token || !secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.typ !== 'access') return null;
    return typeof payload.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

async function hasAccess(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ACCESS_COOKIE)?.value;
  const secret = accessSecret();
  if (!token || !secret) return false;
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload.typ === 'access';
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    const role = await readAccessRole(request);
    if (role !== 'ADMIN' && role !== 'SUPPORT') {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith('/account') || pathname.startsWith('/checkout')) {
    const ok = await hasAccess(request);
    if (!ok) {
      const login = new URL('/login', request.url);
      login.searchParams.set('next', pathname + request.nextUrl.search);
      return NextResponse.redirect(login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/checkout', '/checkout/:path*'],
};

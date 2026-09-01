import { createHash, randomBytes } from 'node:crypto';
import { SignJWT, jwtVerify } from 'jose';
import type { UserRole } from '@vorqen/types';

const ACCESS_TTL = '15m';
const REFRESH_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days
const CHALLENGE_TTL_MS = 1000 * 60 * 60; // 1 hour

export type AccessTokenClaims = {
  sub: string;
  role: UserRole;
  typ: 'access';
};

export type RefreshTokenClaims = {
  sub: string;
  jti: string;
  typ: 'refresh';
};

function requireSecret(name: 'JWT_SECRET' | 'JWT_REFRESH_SECRET'): Uint8Array {
  const value = process.env[name];
  if (!value || value.length < 32) {
    throw new Error(`${name} must be set to at least 32 characters.`);
  }
  return new TextEncoder().encode(value);
}

export async function signAccessToken(userId: string, role: UserRole): Promise<string> {
  return new SignJWT({ role, typ: 'access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(ACCESS_TTL)
    .sign(requireSecret('JWT_SECRET'));
}

export async function signRefreshToken(userId: string, jti: string): Promise<string> {
  return new SignJWT({ typ: 'refresh' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(`${REFRESH_TTL_SECONDS}s`)
    .sign(requireSecret('JWT_REFRESH_SECRET'));
}

export async function verifyAccessToken(token: string): Promise<AccessTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, requireSecret('JWT_SECRET'));
    if (payload.typ !== 'access' || typeof payload.sub !== 'string') return null;
    if (typeof payload.role !== 'string') return null;
    return {
      sub: payload.sub,
      role: payload.role as UserRole,
      typ: 'access',
    };
  } catch {
    return null;
  }
}

export async function verifyRefreshToken(token: string): Promise<RefreshTokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, requireSecret('JWT_REFRESH_SECRET'));
    if (payload.typ !== 'refresh' || typeof payload.sub !== 'string') return null;
    if (typeof payload.jti !== 'string') return null;
    return { sub: payload.sub, jti: payload.jti, typ: 'refresh' };
  } catch {
    return null;
  }
}

export function refreshExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + REFRESH_TTL_SECONDS * 1000);
}

export function challengeExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + CHALLENGE_TTL_MS);
}

/** Opaque token for email verify / password reset (returned to client once). */
export function generateOpaqueToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

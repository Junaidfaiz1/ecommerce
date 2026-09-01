import {
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TAGLINE,
} from '@vorqen/types';

export function appBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return raw.replace(/\/$/, '');
}

export function absoluteUrl(path = '/'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${appBaseUrl()}${normalized}`;
}

export const SITE_DEFAULTS = {
  name: SITE_NAME,
  tagline: SITE_TAGLINE,
  description: SITE_DESCRIPTION,
} as const;

import type { Metadata } from 'next';
import { SITE_DESCRIPTION, SITE_NAME } from '@vorqen/types';
import { absoluteUrl, appBaseUrl } from './site';

const PRIVATE_ROBOTS: Metadata['robots'] = {
  index: false,
  follow: false,
  nocache: true,
  googleBot: { index: false, follow: false, noimageindex: true },
};

export function privatePageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    robots: PRIVATE_ROBOTS,
    alternates: { canonical: undefined },
  };
}

export function publicPageMetadata(input: {
  title: string;
  description?: string;
  path: string;
  image?: string | null;
}): Metadata {
  const url = absoluteUrl(input.path);
  const description = input.description ?? SITE_DESCRIPTION;
  return {
    title: input.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: `${input.title} · ${SITE_NAME}`,
      description,
      url,
      ...(input.image ? { images: [{ url: input.image }] } : {}),
    },
    twitter: {
      card: input.image ? 'summary_large_image' : 'summary',
      title: `${input.title} · ${SITE_NAME}`,
      description,
      ...(input.image ? { images: [input.image] } : {}),
    },
  };
}

export function metadataBaseUrl(): URL {
  try {
    return new URL(appBaseUrl());
  } catch {
    return new URL('http://localhost:3000');
  }
}

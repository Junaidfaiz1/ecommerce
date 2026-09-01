export const SITE_NAME = 'VORQEN';
export const SITE_TAGLINE = 'Build Beyond Limits.';
export const SITE_DESCRIPTION =
  'Premium gaming hardware marketplace with a compatibility-checked PC Builder.';

/** Public marketing routes included in sitemap.xml. */
export const SITEMAP_STATIC_PATHS = ['/', '/shop', '/build', '/compare'] as const;

/** Private / transactional paths — robots.txt Disallow + noindex. */
export const ROBOTS_DISALLOW_PATHS = [
  '/admin',
  '/account',
  '/checkout',
  '/api',
  '/cart',
  '/wishlist',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
] as const;

export type JsonLd = Record<string, unknown>;

export function organizationJsonLd(input: {
  name: string;
  url: string;
  description: string;
}): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: input.name,
    url: input.url,
    description: input.description,
  };
}

export function websiteJsonLd(input: {
  name: string;
  url: string;
  description: string;
  searchUrl?: string;
}): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: input.name,
    url: input.url,
    description: input.description,
  };
  if (input.searchUrl) {
    node.potentialAction = {
      '@type': 'SearchAction',
      target: `${input.searchUrl}{search_term_string}`,
      'query-input': 'required name=search_term_string',
    };
  }
  return node;
}

export function productJsonLd(input: {
  name: string;
  url: string;
  description: string;
  brandName: string;
  imageUrl?: string | null;
  sku?: string | null;
  price?: string | null;
  currency?: string | null;
  inStock?: boolean;
}): JsonLd {
  const node: JsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    url: input.url,
    description: input.description,
    brand: {
      '@type': 'Brand',
      name: input.brandName,
    },
  };
  if (input.imageUrl) node.image = input.imageUrl;
  if (input.sku) node.sku = input.sku;
  if (input.price && input.currency) {
    node.offers = {
      '@type': 'Offer',
      url: input.url,
      priceCurrency: input.currency,
      price: input.price,
      availability: input.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    };
  }
  return node;
}

/** Safe JSON-LD serialization (escape `<` so `</script>` cannot break out). */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

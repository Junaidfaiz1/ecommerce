/**
 * Baseline HTTP security headers (Phase 16).
 * CSP allows Stripe.js + R2/CDN media for 3D and product images.
 */

export function contentSecurityPolicy(isProd: boolean): string {
  const scriptSrc = isProd
    ? "'self' 'unsafe-inline' https://js.stripe.com"
    : "'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com";

  const directives = [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.stripe.com https://*.stripe.com https:",
    "frame-src https://js.stripe.com https://hooks.stripe.com",
    "worker-src 'self' blob:",
    "media-src 'self' blob: https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];
  if (isProd) directives.push('upgrade-insecure-requests');
  return directives.join('; ');
}

export function SECURITY_HEADERS(isProd = process.env.NODE_ENV === 'production') {
  const headers: Array<{ key: string; value: string }> = [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
    },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(isProd) },
  ];
  if (isProd) {
    headers.push({
      key: 'Strict-Transport-Security',
      value: 'max-age=63072000; includeSubDomains; preload',
    });
  }
  return headers;
}

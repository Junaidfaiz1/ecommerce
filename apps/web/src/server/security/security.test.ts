import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  adminAuditLogListInputSchema,
  evaluateRateLimit,
  productJsonLd,
  rateLimitBucketForFields,
  RATE_LIMIT_RULES,
  ROBOTS_DISALLOW_PATHS,
  sanitizeAuditMetadata,
  serializeJsonLd,
  SITEMAP_STATIC_PATHS,
} from '@vorqen/types';
import { consumeRateLimit, resetRateLimitStore } from './rate-limit';

describe('evaluateRateLimit', () => {
  const rule = { limit: 3, windowMs: 1000 };

  it('allows hits under the limit and decrements remaining', () => {
    const first = evaluateRateLimit([], rule, 1000);
    assert.equal(first.decision.allowed, true);
    assert.equal(first.decision.remaining, 2);
    const second = evaluateRateLimit(first.nextTimestamps, rule, 1100);
    assert.equal(second.decision.allowed, true);
    assert.equal(second.decision.remaining, 1);
  });

  it('denies when the window is full and reports retryAfter', () => {
    const stamps = [1000, 1100, 1200];
    const denied = evaluateRateLimit(stamps, rule, 1300);
    assert.equal(denied.decision.allowed, false);
    assert.equal(denied.decision.remaining, 0);
    assert.equal(denied.decision.retryAfterMs, 700);
    assert.deepEqual(denied.nextTimestamps, stamps);
  });

  it('drops timestamps outside the window', () => {
    const next = evaluateRateLimit([1, 2, 3], rule, 5000);
    assert.equal(next.decision.allowed, true);
    assert.deepEqual(next.nextTimestamps, [5000]);
  });
});

describe('rateLimitBucketForFields', () => {
  it('classifies auth and checkout ahead of generic mutations', () => {
    assert.equal(rateLimitBucketForFields('mutation', ['login']), 'auth');
    assert.equal(
      rateLimitBucketForFields('mutation', ['createCheckoutSession']),
      'checkout',
    );
    assert.equal(rateLimitBucketForFields('mutation', ['addToCart']), 'mutate');
    assert.equal(rateLimitBucketForFields('query', ['products']), 'query');
  });

  it('keeps auth stricter than checkout', () => {
    assert.ok(RATE_LIMIT_RULES.auth.windowMs > RATE_LIMIT_RULES.checkout.windowMs);
    assert.ok(RATE_LIMIT_RULES.auth.limit <= RATE_LIMIT_RULES.checkout.limit);
  });
});

describe('in-memory consumeRateLimit', () => {
  it('blocks the N+1 hit for the same key', () => {
    resetRateLimitStore();
    const rule = { limit: 2, windowMs: 60_000 };
    assert.equal(consumeRateLimit('t:a', rule, 1).allowed, true);
    assert.equal(consumeRateLimit('t:a', rule, 2).allowed, true);
    assert.equal(consumeRateLimit('t:a', rule, 3).allowed, false);
    assert.equal(consumeRateLimit('t:b', rule, 3).allowed, true);
  });
});

describe('sanitizeAuditMetadata', () => {
  it('redacts secret keys and truncates depth', () => {
    const cleaned = sanitizeAuditMetadata({
      sku: 'GPU-1',
      password: 'hunter2',
      refreshToken: 'abc',
      nested: { clientSecret: 'pi_secret', ok: true },
    }) as Record<string, unknown>;
    assert.equal(cleaned.sku, 'GPU-1');
    assert.equal(cleaned.password, '[redacted]');
    assert.equal(cleaned.refreshToken, '[redacted]');
    const nested = cleaned.nested as Record<string, unknown>;
    assert.equal(nested.clientSecret, '[redacted]');
    assert.equal(nested.ok, true);
  });
});

describe('adminAuditLogListInputSchema', () => {
  it('defaults pagination and rejects unknown fields', () => {
    const parsed = adminAuditLogListInputSchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 20);
    assert.equal(
      adminAuditLogListInputSchema.safeParse({ page: 1, extra: true }).success,
      false,
    );
  });
});

describe('SEO helpers', () => {
  it('includes public paths and disallows private ones', () => {
    assert.ok(SITEMAP_STATIC_PATHS.includes('/build'));
    assert.ok(ROBOTS_DISALLOW_PATHS.includes('/admin'));
    assert.ok(ROBOTS_DISALLOW_PATHS.includes('/checkout'));
    assert.ok(ROBOTS_DISALLOW_PATHS.includes('/api'));
  });

  it('builds Product JSON-LD from server price, not a client total', () => {
    const ld = productJsonLd({
      name: 'Test GPU',
      url: 'https://example.test/gpu/test-gpu',
      description: 'A GPU',
      brandName: 'VORQEN',
      sku: 'GPU-1',
      price: '499.00',
      currency: 'USD',
      inStock: true,
    });
    const offers = ld.offers as Record<string, unknown>;
    assert.equal(offers.price, '499.00');
    assert.equal(offers.priceCurrency, 'USD');
    assert.ok(serializeJsonLd(ld).includes('\\u003c') === false);
    assert.ok(serializeJsonLd({ html: '</script>' }).includes('\\u003c'));
  });
});

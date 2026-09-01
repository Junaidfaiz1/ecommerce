import { z } from 'zod';
import { cuidSchema, paginationInputSchema } from './catalog';

export const RATE_LIMIT_BUCKETS = ['auth', 'checkout', 'mutate', 'query'] as const;
export type RateLimitBucket = (typeof RATE_LIMIT_BUCKETS)[number];

export type RateLimitRule = {
  limit: number;
  windowMs: number;
};

export type RateLimitDecision = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterMs: number;
  resetAt: number;
};

/** Auth mutations — password spraying / account enumeration. */
export const AUTH_OPERATION_FIELDS = [
  'login',
  'register',
  'requestPasswordReset',
  'resetPassword',
  'verifyEmail',
  'resendVerificationEmail',
  'refreshAuth',
] as const;

/** Checkout PI create — card / inventory abuse. */
export const CHECKOUT_OPERATION_FIELDS = ['createCheckoutSession'] as const;

export const RATE_LIMIT_RULES: Record<RateLimitBucket, RateLimitRule> = {
  auth: { limit: 8, windowMs: 15 * 60 * 1000 },
  checkout: { limit: 10, windowMs: 60 * 1000 },
  mutate: { limit: 40, windowMs: 60 * 1000 },
  query: { limit: 90, windowMs: 60 * 1000 },
};

/** Coarse HTTP cap for `/api/graphql` (GraphiQL + all operations). */
export const GRAPHQL_HTTP_RATE_LIMIT: RateLimitRule = {
  limit: 180,
  windowMs: 60 * 1000,
};

const AUTH_FIELD_SET = new Set<string>(AUTH_OPERATION_FIELDS);
const CHECKOUT_FIELD_SET = new Set<string>(CHECKOUT_OPERATION_FIELDS);

export function rateLimitBucketForFields(
  operationType: 'query' | 'mutation' | 'subscription',
  fields: readonly string[],
): RateLimitBucket {
  if (fields.some((field) => AUTH_FIELD_SET.has(field))) return 'auth';
  if (fields.some((field) => CHECKOUT_FIELD_SET.has(field))) return 'checkout';
  if (operationType === 'mutation') return 'mutate';
  return 'query';
}

/**
 * Sliding-window limiter. `timestamps` are prior hits in the window.
 * Inject `now` in tests. Pure — the store lives on the server.
 */
export function evaluateRateLimit(
  timestamps: readonly number[],
  rule: RateLimitRule,
  now = Date.now(),
): { decision: RateLimitDecision; nextTimestamps: number[] } {
  const windowStart = now - rule.windowMs;
  const recent = timestamps.filter((t) => t > windowStart).sort((a, b) => a - b);

  if (recent.length >= rule.limit) {
    const oldest = recent[0] ?? now;
    const resetAt = oldest + rule.windowMs;
    return {
      decision: {
        allowed: false,
        remaining: 0,
        limit: rule.limit,
        retryAfterMs: Math.max(0, resetAt - now),
        resetAt,
      },
      nextTimestamps: recent,
    };
  }

  const nextTimestamps = [...recent, now];
  return {
    decision: {
      allowed: true,
      remaining: rule.limit - nextTimestamps.length,
      limit: rule.limit,
      retryAfterMs: 0,
      resetAt: now + rule.windowMs,
    },
    nextTimestamps,
  };
}

export const AUDIT_ACTIONS = [
  'brand.create',
  'brand.update',
  'category.create',
  'category.update',
  'product.create',
  'product.update',
  'variant.create',
  'variant.update',
  'order.cancel_pending',
  'order.status',
  'order.refund',
  'user.activate',
  'user.deactivate',
  'inventory.adjust',
  'coupon.create',
  'coupon.update',
  'bundle.create',
  'bundle.update',
  'review.approve',
  'review.reject',
] as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export const AUDIT_ENTITY_TYPES = [
  'Brand',
  'Category',
  'Product',
  'ProductVariant',
  'Order',
  'User',
  'Inventory',
  'Coupon',
  'Bundle',
  'Review',
] as const;

export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];

const SENSITIVE_KEY =
  /pass(word)?|token|secret|authorization|cookie|card|cvv|cvc|pan|ssn|refresh|clientSecret/i;

const MAX_META_DEPTH = 4;
const MAX_META_KEYS = 40;
const MAX_META_ARRAY = 20;
const MAX_META_STRING = 500;

/** Strip secrets / oversized dumps before persisting audit metadata. */
export function sanitizeAuditMetadata(value: unknown, depth = 0): unknown {
  if (value == null) return value;
  if (depth > MAX_META_DEPTH) return '[truncated]';
  if (typeof value === 'string') return value.slice(0, MAX_META_STRING);
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (typeof value === 'bigint') return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value
      .slice(0, MAX_META_ARRAY)
      .map((item) => sanitizeAuditMetadata(item, depth + 1));
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).slice(
      0,
      MAX_META_KEYS,
    );
    const out: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      out[key] = SENSITIVE_KEY.test(key)
        ? '[redacted]'
        : sanitizeAuditMetadata(nested, depth + 1);
    }
    return out;
  }
  return String(value).slice(0, MAX_META_STRING);
}

export function isAuditAction(value: string): value is AuditAction {
  return (AUDIT_ACTIONS as readonly string[]).includes(value);
}

export const adminAuditLogListInputSchema = paginationInputSchema
  .extend({
    pageSize: z.number().int().min(1).max(48).default(20),
    action: z.string().trim().min(1).max(80).optional(),
    entityType: z.string().trim().min(1).max(80).optional(),
    actorUserId: cuidSchema.optional(),
  })
  .strict();

export type AdminAuditLogListInput = z.infer<typeof adminAuditLogListInputSchema>;

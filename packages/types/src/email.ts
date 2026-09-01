import { z } from 'zod';
import { cuidSchema } from './catalog';

export const EMAIL_TEMPLATE_KEYS = [
  'verify_email',
  'password_reset',
  'order_paid',
  'abandoned_cart_1',
  'abandoned_cart_2',
] as const;
export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const ABANDONED_CART_STATUSES = [
  'ACTIVE',
  'EMAIL_SENT',
  'CLICKED',
  'RECOVERED',
  'EXPIRED',
] as const;
export type AbandonedCartStatus = (typeof ABANDONED_CART_STATUSES)[number];

export const OPEN_ABANDONED_CART_STATUSES = [
  'ACTIVE',
  'EMAIL_SENT',
  'CLICKED',
] as const;
export type OpenAbandonedCartStatus =
  (typeof OPEN_ABANDONED_CART_STATUSES)[number];

/** Idle before the first recovery email. */
export const ABANDONED_CART_IDLE_MS = 60 * 60 * 1000;
/** Minimum gap before a reminder. */
export const ABANDONED_CART_REMINDER_MS = 24 * 60 * 60 * 1000;
/** After this idle window the record expires (no more emails). */
export const ABANDONED_CART_EXPIRE_MS = 7 * 24 * 60 * 60 * 1000;
export const ABANDONED_CART_MAX_EMAILS = 2;

export const abandonedCartClickIdSchema = cuidSchema;

export type AbandonedCartSnapshot = {
  now: Date;
  itemCount: number;
  email: string | null;
  lastActivityAt: Date;
  status: AbandonedCartStatus | null;
  emails: Array<{ templateKey: string; sentAt: Date }>;
};

export type AbandonedCartDecision =
  | {
      action: 'skip';
      reason:
        | 'empty'
        | 'no_email'
        | 'too_fresh'
        | 'cooldown'
        | 'max_emails'
        | 'terminal';
    }
  | { action: 'expire' }
  | { action: 'send'; templateKey: 'abandoned_cart_1' | 'abandoned_cart_2' };

/**
 * Pure scheduler: which abandoned-cart email (if any) to send.
 * Inject `now` in tests — never trust a client clock.
 */
export function decideAbandonedCartAction(
  snapshot: AbandonedCartSnapshot,
): AbandonedCartDecision {
  if (
    snapshot.status === 'RECOVERED' ||
    snapshot.status === 'EXPIRED'
  ) {
    return { action: 'skip', reason: 'terminal' };
  }
  if (snapshot.itemCount < 1) {
    return { action: 'skip', reason: 'empty' };
  }
  if (!snapshot.email?.includes('@')) {
    return { action: 'skip', reason: 'no_email' };
  }

  const idleMs = snapshot.now.getTime() - snapshot.lastActivityAt.getTime();
  if (idleMs < ABANDONED_CART_IDLE_MS) {
    return { action: 'skip', reason: 'too_fresh' };
  }
  if (idleMs >= ABANDONED_CART_EXPIRE_MS) {
    return { action: 'expire' };
  }

  const sent = [...snapshot.emails].sort(
    (a, b) => a.sentAt.getTime() - b.sentAt.getTime(),
  );
  if (sent.length === 0) {
    return { action: 'send', templateKey: 'abandoned_cart_1' };
  }
  if (sent.length >= ABANDONED_CART_MAX_EMAILS) {
    return { action: 'skip', reason: 'max_emails' };
  }

  const lastSent = sent[sent.length - 1]!;
  if (snapshot.now.getTime() - lastSent.sentAt.getTime() < ABANDONED_CART_REMINDER_MS) {
    return { action: 'skip', reason: 'cooldown' };
  }
  return { action: 'send', templateKey: 'abandoned_cart_2' };
}

export function cronSecretMatches(
  authorization: string | null,
  secret: string | undefined,
): boolean {
  if (!secret || secret.length < 16) return false;
  if (!authorization) return false;
  return authorization === `Bearer ${secret}`;
}

export const sendMailInputSchema = z
  .object({
    to: z.string().trim().email().max(254),
    subject: z.string().trim().min(1).max(200),
    html: z.string().min(1).max(100_000),
    text: z.string().min(1).max(100_000),
  })
  .strict();

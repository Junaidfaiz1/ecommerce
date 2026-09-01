import {
  evaluateRateLimit,
  type RateLimitDecision,
  type RateLimitRule,
} from '@vorqen/types';

const hits = new Map<string, number[]>();
let lastPruneAt = 0;
const PRUNE_EVERY_MS = 60_000;
const MAX_KEYS = 20_000;

function prune(now: number) {
  if (hits.size > MAX_KEYS) {
    hits.clear();
    return;
  }
  for (const [key, stamps] of hits) {
    const kept = stamps.filter((t) => now - t < 15 * 60 * 1000);
    if (kept.length === 0) hits.delete(key);
    else hits.set(key, kept);
  }
}

/**
 * In-process sliding window. Per Vercel instance (no Redis).
 * Sufficient for abuse dampening; not a global cluster counter.
 */
export function consumeRateLimit(
  key: string,
  rule: RateLimitRule,
  now = Date.now(),
): RateLimitDecision {
  if (now - lastPruneAt > PRUNE_EVERY_MS) {
    prune(now);
    lastPruneAt = now;
  }
  const current = hits.get(key) ?? [];
  const { decision, nextTimestamps } = evaluateRateLimit(current, rule, now);
  hits.set(key, nextTimestamps);
  return decision;
}

/** Test helper — not used in production paths. */
export function resetRateLimitStore() {
  hits.clear();
  lastPruneAt = 0;
}

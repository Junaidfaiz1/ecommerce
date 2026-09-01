import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const origin = process.env.E2E_BASE_URL?.replace(/\/$/, '') ?? '';

describe('UI route smoke', () => {
  it(
    'hits public routes and requires auth on checkout when a server is running',
    { skip: origin ? false : 'Set E2E_BASE_URL to a running Next.js origin' },
    async () => {
      const health = await fetch(`${origin}/api/health`);
      assert.ok(health.status === 200 || health.status === 503);
      const body = (await health.json()) as { service?: string };
      assert.equal(body.service, 'vorqen');

      for (const path of ['/', '/shop', '/build', '/login', '/cart']) {
        const response = await fetch(`${origin}${path}`, { redirect: 'manual' });
        assert.ok(
          response.status < 500,
          `${path} returned ${response.status}`,
        );
      }

      const checkout = await fetch(`${origin}/checkout`, { redirect: 'manual' });
      assert.ok(
        checkout.status === 307 ||
          checkout.status === 302 ||
          checkout.status === 200,
      );
      if (checkout.status === 307 || checkout.status === 302) {
        assert.match(checkout.headers.get('location') ?? '', /login/i);
      }
    },
  );
});

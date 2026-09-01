import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ABANDONED_CART_EXPIRE_MS,
  ABANDONED_CART_IDLE_MS,
  ABANDONED_CART_REMINDER_MS,
  cronSecretMatches,
  decideAbandonedCartAction,
  sendMailInputSchema,
} from '@vorqen/types';
import {
  abandonedCartTemplate,
  orderPaidTemplate,
  verifyEmailTemplate,
} from './templates';

const NOW = new Date('2026-09-01T12:00:00.000Z');

function hoursAgo(hours: number): Date {
  return new Date(NOW.getTime() - hours * 60 * 60 * 1000);
}

describe('decideAbandonedCartAction', () => {
  it('skips empty carts', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 0,
      email: 'builder@vorqen.local',
      lastActivityAt: hoursAgo(3),
      status: 'ACTIVE',
      emails: [],
    });
    assert.deepEqual(decision, { action: 'skip', reason: 'empty' });
  });

  it('skips carts without an email', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 2,
      email: null,
      lastActivityAt: hoursAgo(3),
      status: 'ACTIVE',
      emails: [],
    });
    assert.deepEqual(decision, { action: 'skip', reason: 'no_email' });
  });

  it('skips carts that are still active', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: new Date(NOW.getTime() - ABANDONED_CART_IDLE_MS + 1_000),
      status: 'ACTIVE',
      emails: [],
    });
    assert.deepEqual(decision, { action: 'skip', reason: 'too_fresh' });
  });

  it('sends the first email after the idle window', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: hoursAgo(2),
      status: 'ACTIVE',
      emails: [],
    });
    assert.deepEqual(decision, {
      action: 'send',
      templateKey: 'abandoned_cart_1',
    });
  });

  it('waits for the reminder cooldown', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: hoursAgo(5),
      status: 'EMAIL_SENT',
      emails: [
        {
          templateKey: 'abandoned_cart_1',
          sentAt: new Date(NOW.getTime() - ABANDONED_CART_REMINDER_MS + 60_000),
        },
      ],
    });
    assert.deepEqual(decision, { action: 'skip', reason: 'cooldown' });
  });

  it('sends a reminder after 24 hours', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: hoursAgo(30),
      status: 'CLICKED',
      emails: [
        {
          templateKey: 'abandoned_cart_1',
          sentAt: hoursAgo(25),
        },
      ],
    });
    assert.deepEqual(decision, {
      action: 'send',
      templateKey: 'abandoned_cart_2',
    });
  });

  it('does not send more than two emails', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: hoursAgo(50),
      status: 'EMAIL_SENT',
      emails: [
        { templateKey: 'abandoned_cart_1', sentAt: hoursAgo(48) },
        { templateKey: 'abandoned_cart_2', sentAt: hoursAgo(25) },
      ],
    });
    assert.deepEqual(decision, { action: 'skip', reason: 'max_emails' });
  });

  it('expires campaigns after seven idle days', () => {
    const decision = decideAbandonedCartAction({
      now: NOW,
      itemCount: 1,
      email: 'builder@vorqen.local',
      lastActivityAt: new Date(NOW.getTime() - ABANDONED_CART_EXPIRE_MS),
      status: 'EMAIL_SENT',
      emails: [{ templateKey: 'abandoned_cart_1', sentAt: hoursAgo(48) }],
    });
    assert.deepEqual(decision, { action: 'expire' });
  });

  it('skips recovered and expired records', () => {
    assert.deepEqual(
      decideAbandonedCartAction({
        now: NOW,
        itemCount: 1,
        email: 'builder@vorqen.local',
        lastActivityAt: hoursAgo(3),
        status: 'RECOVERED',
        emails: [],
      }),
      { action: 'skip', reason: 'terminal' },
    );
    assert.deepEqual(
      decideAbandonedCartAction({
        now: NOW,
        itemCount: 1,
        email: 'builder@vorqen.local',
        lastActivityAt: hoursAgo(3),
        status: 'EXPIRED',
        emails: [],
      }),
      { action: 'skip', reason: 'terminal' },
    );
  });
});

describe('cronSecretMatches', () => {
  it('rejects short or missing secrets', () => {
    assert.equal(cronSecretMatches('Bearer abc', 'short'), false);
    assert.equal(cronSecretMatches('Bearer long-enough-secret!', ''), false);
    assert.equal(cronSecretMatches(null, 'long-enough-secret!'), false);
  });

  it('accepts an exact bearer token', () => {
    const secret = 'change-me-cron-secret';
    assert.equal(cronSecretMatches(`Bearer ${secret}`, secret), true);
    assert.equal(cronSecretMatches(`Bearer ${secret}x`, secret), false);
  });
});

describe('email templates', () => {
  it('includes verify links in text and html', () => {
    const url = 'http://localhost:3000/verify-email?token=abc';
    const message = verifyEmailTemplate(url);
    assert.match(message.text, /abc/);
    assert.match(message.html, /verify-email/);
  });

  it('escapes product names in abandoned-cart html', () => {
    const message = abandonedCartTemplate({
      templateKey: 'abandoned_cart_1',
      clickUrl: 'http://localhost:3000/api/email/abandoned/clidclick',
      itemNames: ['<script>alert(1)</script> GPU'],
    });
    assert.equal(message.html.includes('<script>alert(1)</script>'), false);
    assert.match(message.html, /&lt;script&gt;/);
    assert.match(message.text, /GPU/);
  });

  it('includes the order number and total', () => {
    const message = orderPaidTemplate({
      orderNumber: 'VQ-1001',
      currency: 'USD',
      grandTotal: '1299.00',
      items: [{ name: 'RTX 4080 SUPER', quantity: 1, lineTotal: '1299.00' }],
    });
    assert.match(message.subject, /VQ-1001/);
    assert.match(message.text, /1,299/);
  });
});

describe('sendMailInputSchema', () => {
  it('rejects unknown fields and bad recipients', () => {
    assert.equal(
      sendMailInputSchema.safeParse({
        to: 'not-an-email',
        subject: 'Hi',
        html: '<p>Hi</p>',
        text: 'Hi',
      }).success,
      false,
    );
    assert.equal(
      sendMailInputSchema.safeParse({
        to: 'builder@vorqen.local',
        subject: 'Hi',
        html: '<p>Hi</p>',
        text: 'Hi',
        extra: true,
      }).success,
      false,
    );
  });
});

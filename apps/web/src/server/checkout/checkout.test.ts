import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Stripe from 'stripe';
import {
  checkoutStatusInputSchema,
  createCheckoutInputSchema,
  decidePaidTransition,
  generateOrderNumber,
  stripePaymentIntentIdSchema,
  stripePaymentIntentObjectSchema,
  toStripeAmountCents,
} from '@vorqen/types';

const address = {
  line1: '100 Hardware Way',
  city: 'Austin',
  postalCode: '78701',
  country: 'US',
};

describe('checkout schemas', () => {
  it('accepts a saved shipping address id', () => {
    const parsed = createCheckoutInputSchema.parse({
      shippingAddressId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    assert.equal(parsed.saveAddress, false);
    assert.equal(parsed.shippingAddressId, 'clxxxxxxxxxxxxxxxxxxxxxxxxx');
  });

  it('accepts an inline shipping address', () => {
    const parsed = createCheckoutInputSchema.parse({
      shippingAddress: address,
      saveAddress: true,
    });
    assert.equal(parsed.saveAddress, true);
    assert.equal(parsed.shippingAddress?.city, 'Austin');
  });

  it('rejects missing shipping', () => {
    const result = createCheckoutInputSchema.safeParse({});
    assert.equal(result.success, false);
  });

  it('rejects both shipping id and inline address', () => {
    const result = createCheckoutInputSchema.safeParse({
      shippingAddressId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      shippingAddress: address,
    });
    assert.equal(result.success, false);
  });

  it('requires exactly one checkout status locator', () => {
    assert.equal(checkoutStatusInputSchema.safeParse({}).success, false);
    assert.equal(
      checkoutStatusInputSchema.safeParse({
        paymentIntentId: 'pi_abc12345',
        orderId: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
      }).success,
      false,
    );
    const parsed = checkoutStatusInputSchema.parse({
      paymentIntentId: 'pi_abc12345',
    });
    assert.equal(parsed.paymentIntentId, 'pi_abc12345');
  });

  it('rejects non-stripe payment intent ids', () => {
    assert.equal(stripePaymentIntentIdSchema.safeParse('cs_test_1').success, false);
  });
});

describe('checkout money', () => {
  it('converts major units to stripe cents', () => {
    assert.equal(toStripeAmountCents('19.99'), 1999);
    assert.equal(toStripeAmountCents(10.5), 1050);
    assert.equal(toStripeAmountCents('0.50'), 50);
  });

  it('rejects negative amounts', () => {
    assert.throws(() => toStripeAmountCents(-1));
  });
});

describe('order numbers', () => {
  it('uses UTC date and entropy suffix', () => {
    const n = generateOrderNumber(
      new Date('2026-09-01T12:00:00.000Z'),
      'ab12cd',
    );
    assert.equal(n, 'VQ-20260901-AB12CD');
  });
});

describe('paid transition rules', () => {
  const base = {
    paymentStatus: 'REQUIRES_PAYMENT' as const,
    orderId: 'ord_1',
    metadataOrderId: 'ord_1',
    orderAmountCents: 1999,
    stripeAmountCents: 1999,
    orderCurrency: 'USD',
    stripeCurrency: 'usd',
    stripePaymentStatus: 'succeeded',
  };

  it('applies when amount, currency, and succeeded status match', () => {
    assert.deepEqual(decidePaidTransition(base), { action: 'apply' });
  });

  it('skips already succeeded payments (idempotent)', () => {
    const result = decidePaidTransition({
      ...base,
      paymentStatus: 'SUCCEEDED',
    });
    assert.deepEqual(result, { action: 'skip', reason: 'already_paid' });
  });

  it('skips metadata order mismatch', () => {
    const result = decidePaidTransition({
      ...base,
      metadataOrderId: 'ord_other',
    });
    assert.deepEqual(result, { action: 'skip', reason: 'wrong_order' });
  });

  it('rejects amount mismatch', () => {
    const result = decidePaidTransition({
      ...base,
      stripeAmountCents: 1,
    });
    assert.deepEqual(result, { action: 'reject', reason: 'amount_mismatch' });
  });

  it('rejects currency mismatch', () => {
    const result = decidePaidTransition({
      ...base,
      stripeCurrency: 'eur',
    });
    assert.deepEqual(result, { action: 'reject', reason: 'currency_mismatch' });
  });

  it('rejects unpaid stripe status', () => {
    const result = decidePaidTransition({
      ...base,
      stripePaymentStatus: 'requires_payment_method',
    });
    assert.deepEqual(result, { action: 'reject', reason: 'not_paid' });
  });
});

describe('stripe payment intent parse', () => {
  it('parses a payment_intent object after signature verification', () => {
    const parsed = stripePaymentIntentObjectSchema.parse({
      id: 'pi_abc',
      object: 'payment_intent',
      amount: 1999,
      currency: 'usd',
      status: 'succeeded',
      metadata: { orderId: 'ord_1', userId: 'user_1' },
      extra: 'ignored',
    });
    assert.equal(parsed.amount, 1999);
    assert.equal(parsed.metadata.orderId, 'ord_1');
  });
});

describe('stripe webhook signatures', () => {
  it('constructs a verifiable event from a test header', () => {
    const secret = 'whsec_test_vorqen_signature';
    const payload = JSON.stringify({
      id: 'evt_test',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: { object: { id: 'pi_1' } },
    });
    const header = Stripe.webhooks.generateTestHeaderString({
      payload,
      secret,
    });
    const event = Stripe.webhooks.constructEvent(payload, header, secret);
    assert.equal(event.type, 'payment_intent.succeeded');
  });

  it('rejects a forged signature', () => {
    const payload = JSON.stringify({ id: 'evt_test', type: 'ping' });
    assert.throws(() =>
      Stripe.webhooks.constructEvent(payload, 't=1,v1=deadbeef', 'whsec_real'),
    );
  });
});

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { orderIdInputSchema, orderListInputSchema } from '@vorqen/types';

describe('order schemas', () => {
  it('applies list pagination defaults', () => {
    const parsed = orderListInputSchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 10);
  });

  it('accepts an order status filter', () => {
    const parsed = orderListInputSchema.parse({
      page: 2,
      pageSize: 10,
      status: 'PAID',
    });
    assert.equal(parsed.status, 'PAID');
  });

  it('rejects an unknown order status', () => {
    const result = orderListInputSchema.safeParse({ status: 'LOST' });
    assert.equal(result.success, false);
  });

  it('requires an order id', () => {
    const parsed = orderIdInputSchema.parse({
      id: 'clxxxxxxxxxxxxxxxxxxxxxxxxx',
    });
    assert.equal(parsed.id.startsWith('cl'), true);
  });
});

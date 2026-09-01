import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  COMPARE_MAX_ITEMS,
  compareProductIdsSchema,
  createAddressInputSchema,
  createReviewInputSchema,
  productReviewsInputSchema,
  updateProfileInputSchema,
} from '@vorqen/types';

describe('storefront schemas', () => {
  it('accepts a valid address create payload', () => {
    const parsed = createAddressInputSchema.parse({
      line1: '100 Hardware Ave',
      city: 'Austin',
      postalCode: '78701',
      country: 'us',
    });
    assert.equal(parsed.country, 'US');
    assert.equal(parsed.type, 'SHIPPING');
    assert.equal(parsed.isDefault, false);
  });

  it('rejects invalid country codes', () => {
    assert.throws(() =>
      createAddressInputSchema.parse({
        line1: '100 Hardware Ave',
        city: 'Austin',
        postalCode: '78701',
        country: 'USA',
      }),
    );
  });

  it('requires profile fields', () => {
    assert.throws(() => updateProfileInputSchema.parse({}));
    const parsed = updateProfileInputSchema.parse({ firstName: 'Ada' });
    assert.equal(parsed.firstName, 'Ada');
  });

  it('validates review create input', () => {
    assert.throws(() =>
      createReviewInputSchema.parse({
        productId: 'clxxxxxxxxxxxxxxxxxxxxxx',
        rating: 5,
      }),
    );
    const parsed = createReviewInputSchema.parse({
      productId: 'clxxxxxxxxxxxxxxxxxxxxxx',
      rating: 4,
      body: 'Solid thermals under load.',
    });
    assert.equal(parsed.rating, 4);
  });

  it('requires exactly one product locator for reviews list', () => {
    assert.throws(() => productReviewsInputSchema.parse({}));
    const parsed = productReviewsInputSchema.parse({
      productSlug: 'rtx-5090',
    });
    assert.equal(parsed.productSlug, 'rtx-5090');
    assert.equal(parsed.page, 1);
  });

  it('limits compare ids', () => {
    assert.equal(COMPARE_MAX_ITEMS, 4);
    assert.throws(() =>
      compareProductIdsSchema.parse([
        'claaaaaaaaaaaaaaaaaaaaaaa',
        'clbbbbbbbbbbbbbbbbbbbbbbb',
        'clccccccccccccccccccccccc',
        'clddddddddddddddddddddddd',
        'cleeeeeeeeeeeeeeeeeeeeeee',
      ]),
    );
    const ids = compareProductIdsSchema.parse([
      'claaaaaaaaaaaaaaaaaaaaaaa',
      'clbbbbbbbbbbbbbbbbbbbbbbb',
    ]);
    assert.equal(ids.length, 2);
  });
});

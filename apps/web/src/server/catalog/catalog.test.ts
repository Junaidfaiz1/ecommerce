import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  productListFilterSchema,
  productListInputSchema,
  slugSchema,
} from '@vorqen/types';
import {
  buildProductWhere,
  isPriceSort,
  paginationMeta,
} from './catalog.filters';

describe('catalog filter schemas', () => {
  it('accepts valid list input defaults', () => {
    const parsed = productListInputSchema.parse({});
    assert.equal(parsed.sort, 'FEATURED');
    assert.equal(parsed.page, 1);
    assert.equal(parsed.pageSize, 24);
  });

  it('rejects inverted price range', () => {
    const result = productListFilterSchema.safeParse({
      minPrice: 500,
      maxPrice: 100,
    });
    assert.equal(result.success, false);
  });

  it('rejects invalid slugs', () => {
    assert.equal(slugSchema.safeParse('Bad Slug').success, false);
    assert.equal(slugSchema.safeParse('amd-ryzen-7').success, true);
  });

  it('caps pageSize at 48', () => {
    const result = productListInputSchema.safeParse({ pageSize: 100 });
    assert.equal(result.success, false);
  });
});

describe('buildProductWhere', () => {
  it('always scopes to ACTIVE', () => {
    const where = buildProductWhere(undefined);
    assert.equal(where.status, 'ACTIVE');
  });

  it('applies type, brand, category, and query', () => {
    const where = buildProductWhere({
      type: 'GPU',
      brandSlug: 'asus',
      categorySlug: 'gpu',
      query: '4080',
      featured: true,
    });
    assert.equal(where.type, 'GPU');
    assert.equal(where.isFeatured, true);
    assert.deepEqual(where.brand, { slug: 'asus' });
    assert.deepEqual(where.category, { slug: 'gpu' });
    assert.ok(Array.isArray(where.OR));
  });

  it('adds variant price and stock constraints', () => {
    const where = buildProductWhere({
      minPrice: 100,
      maxPrice: 900,
      inStock: true,
    });
    assert.ok(where.variants);
  });
});

describe('paginationMeta', () => {
  it('computes pages and clamps page', () => {
    const meta = paginationMeta(50, 99, 24);
    assert.equal(meta.totalPages, 3);
    assert.equal(meta.page, 3);
    assert.equal(meta.hasNextPage, false);
    assert.equal(meta.hasPreviousPage, true);
    assert.equal(meta.skip, 48);
  });

  it('handles empty results', () => {
    const meta = paginationMeta(0, 1, 24);
    assert.equal(meta.totalPages, 0);
    assert.equal(meta.hasNextPage, false);
  });
});

describe('isPriceSort', () => {
  it('detects price sorts', () => {
    assert.equal(isPriceSort('PRICE_ASC'), true);
    assert.equal(isPriceSort('PRICE_DESC'), true);
    assert.equal(isPriceSort('FEATURED'), false);
  });
});

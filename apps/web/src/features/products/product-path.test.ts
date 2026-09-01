import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isProductTypePath,
  productHref,
  productTypeToPath,
} from '@/features/products/product-path';

describe('product paths', () => {
  it('maps product types to URL segments', () => {
    assert.equal(productTypeToPath('GPU'), 'gpu');
    assert.equal(productTypeToPath('MOTHERBOARD'), 'motherboard');
    assert.equal(isProductTypePath('gpu'), true);
    assert.equal(isProductTypePath('shop'), false);
  });

  it('builds typed hrefs', () => {
    assert.equal(
      productHref({ type: 'CPU', slug: 'ryzen-7-9800x3d' }),
      '/cpu/ryzen-7-9800x3d',
    );
    assert.equal(
      productHref({ type: 'OTHER', slug: 'misc-item' }),
      '/products/misc-item',
    );
  });
});

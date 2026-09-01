import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CATALOG_PLACEHOLDER_IMAGE } from '@vorqen/types';
import { catalogPhotoPath, toPublicCatalogImageUrl } from './image-url';

describe('toPublicCatalogImageUrl', () => {
  it('maps the fake seed host to the local catalog photo', () => {
    assert.equal(
      toPublicCatalogImageUrl('https://placeholder.vorqen.local/rtx.jpg'),
      CATALOG_PLACEHOLDER_IMAGE,
    );
  });

  it('keeps site-relative catalog paths', () => {
    assert.equal(
      toPublicCatalogImageUrl('/assets/catalog/product.jpg'),
      '/assets/catalog/product.jpg',
    );
  });
});

describe('catalogPhotoPath', () => {
  it('maps generic seed photos to the product slug file', () => {
    assert.equal(
      catalogPhotoPath('GPU', 'rtx-4080-super-16gb', '/assets/catalog/product.jpg'),
      '/assets/catalog/rtx-4080-super-16gb.jpg',
    );
  });
});

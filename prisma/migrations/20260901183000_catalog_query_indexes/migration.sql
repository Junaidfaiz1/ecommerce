-- Catalog list/sort indexes (Phase 18)

CREATE INDEX "products_status_is_featured_idx" ON "products"("status", "is_featured");

CREATE INDEX "products_status_created_at_idx" ON "products"("status", "created_at");

CREATE INDEX "product_variants_is_default_is_active_price_idx" ON "product_variants"("is_default", "is_active", "price");

CREATE INDEX "product_images_product_id_is_primary_idx" ON "product_images"("product_id", "is_primary");

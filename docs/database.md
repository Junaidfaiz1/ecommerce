# Database — VORQEN

> **Phase 2 complete.** Field-level reference for `prisma/schema.prisma`.  
> Engine: PostgreSQL + Prisma 7 (`prisma.config.ts` holds `DATABASE_URL`).

Use **Neon** (recommended) or a native Postgres install. **Do not use Docker.**

```bash
pnpm db:generate          # regenerate client → apps/web/src/generated/prisma
pnpm db:migrate           # create/apply migrations (dev)
pnpm db:migrate:deploy    # apply migrations (CI/prod)
pnpm db:push              # push schema without migration files (quick local)
pnpm db:seed              # seed catalog + compatible/incompatible builds
pnpm db:studio            # Prisma Studio
```

## Conventions

| Topic | Rule |
|-------|------|
| IDs | `cuid()` strings |
| Money | `Decimal(12, 2)` — always recalculated on server |
| Tables | snake_case via `@@map` / `@map` |
| Hardware | **Typed columns** on Cpu/Gpu/Motherboard/Ram/StorageDrive/Psu/PcCase/Cooler — not JSON-only |
| Product ↔ hardware | 1:1 optional relation by `Product.type` |
| Trust | Never trust client for price, stock, compatibility, roles, payment state |

## Enums

| Enum | Values (summary) |
|------|------------------|
| `UserRole` | CUSTOMER, ADMIN, SUPPORT |
| `AddressType` | SHIPPING, BILLING, BOTH |
| `ProductStatus` | DRAFT, ACTIVE, ARCHIVED |
| `ProductType` | CPU, GPU, MOTHERBOARD, RAM, STORAGE, PSU, CASE, COOLER, ACCESSORY, OTHER |
| `ComponentSlot` | CPU, GPU, MOTHERBOARD, RAM, STORAGE, PSU, CASE, COOLER |
| `CompatibilitySeverity` | ERROR, WARNING |
| `BuildVisibility` | PRIVATE, UNLISTED, PUBLIC |
| `OrderStatus` | PENDING_PAYMENT → … → REFUNDED / PARTIALLY_REFUNDED |
| `PaymentStatus` | REQUIRES_PAYMENT → SUCCEEDED / FAILED / … |
| `PaymentProvider` | STRIPE |
| `RefundStatus` | PENDING, SUCCEEDED, FAILED, CANCELLED |
| `CouponType` | PERCENTAGE, FIXED_AMOUNT |
| `InventoryTxnType` | STOCK_IN, STOCK_OUT, RESERVE, RELEASE, ADJUSTMENT, SALE, RETURN |
| `ReviewStatus` | PENDING, APPROVED, REJECTED |
| `AbandonedCartStatus` | ACTIVE, EMAIL_SENT, CLICKED, RECOVERED, EXPIRED |
| `NotificationChannel` | EMAIL, IN_APP |
| `GraphicsQuality` | LOW, MEDIUM, HIGH, ULTRA |
| `StorageInterface` | NVME_M2, SATA_SSD, SATA_HDD, OTHER |
| `CoolerType` | AIR, AIO_LIQUID, CUSTOM_LOOP |
| `AuthChallengePurpose` | EMAIL_VERIFY, PASSWORD_RESET |

---

## Identity

### User (`users`)

| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| email | String | unique |
| passwordHash | String | bcrypt (Phase 4 auth) |
| firstName, lastName | String? | |
| role | UserRole | default CUSTOMER |
| emailVerifiedAt | DateTime? | |
| isActive | Boolean | default true |
| createdAt, updatedAt | DateTime | |

Relations: addresses, builds, cart, wishlist, orders, reviews, couponUsages, notifications, auditLogs, abandonedCarts, inventoryTxns, refreshTokens, authChallenges.

### RefreshToken (`refresh_tokens`)

| Field | Type | Notes |
|-------|------|-------|
| userId | String | FK → User |
| tokenHash | String | unique SHA-256 of refresh `jti` |
| expiresAt | DateTime | 7-day default |
| revokedAt | DateTime? | set on logout / rotation |
| userAgent, ip | String? | optional client meta |

### AuthChallenge (`auth_challenges`)

| Field | Type | Notes |
|-------|------|-------|
| userId | String | FK → User |
| purpose | AuthChallengePurpose | `EMAIL_VERIFY` \| `PASSWORD_RESET` |
| tokenHash | String | unique SHA-256 of opaque token |
| expiresAt | DateTime | 1-hour default |
| usedAt | DateTime? | single-use |

### Address (`addresses`)

| Field | Type | Notes |
|-------|------|-------|
| userId | String | FK → User |
| label | String? | |
| line1, line2 | String / String? | |
| city, state, postalCode | String | |
| country | Char(2) | ISO |
| phone | String? | |
| type | AddressType | |
| isDefault | Boolean | |

---

## Catalog

### Brand (`brands`)

`name`, `slug` (unique), `logoUrl?`, `websiteUrl?`, `description?`

### Category (`categories`)

`name`, `slug` (unique), `parentId?` (self-tree), `sortOrder`, `description?`

### Product (`products`)

| Field | Type | Notes |
|-------|------|-------|
| brandId, categoryId | String | FKs |
| type | ProductType | drives which hardware 1:1 row exists |
| name, slug | String | slug unique |
| description | String? | |
| status | ProductStatus | |
| isFeatured | Boolean | |

Relations: variants, images, assets3d, reviews, cpu/gpu/motherboard/ram/storage/psu/pcCase/cooler, buildItems, bundleItems.

### ProductVariant (`product_variants`)

| Field | Type | Notes |
|-------|------|-------|
| productId | String | FK |
| sku | String | unique |
| name | String? | |
| price | Decimal(12,2) | server authority |
| compareAtPrice | Decimal? | |
| currency | Char(3) | default USD |
| isDefault, isActive | Boolean | |
| weightGrams | Int? | |

### ProductImage (`product_images`)

`productId`, `url`, `alt?`, `sortOrder`, `isPrimary`

### Product3DAsset (`product_3d_assets`)

`productId`, `glbUrl`, `dracoUrl?`, `posterUrl?`, `label?`

Stored `glbUrl` may be an absolute CDN URL, an R2 object key (resolved via `R2_PUBLIC_URL`), or a `procedural://` sentinel for demo meshes.

---

## Hardware (typed specs)

Each model is **1:1** with `Product` via unique `productId`.

### Cpu (`cpus`)

`socket`, `cores`, `threads`, `baseClockGhz`, `boostClockGhz`, `tdpWatts`, `memoryType`, `maxMemoryGhz?`, `hasIntegratedGpu`

### Gpu (`gpus`)

`chipset`, `lengthMm`, `slotWidth`, `tdpWatts`, `recommendedPsuWatts?`, `vramGb`, `powerConnectors`, `interfaceBus`

### Motherboard (`motherboards`)

`socket`, `chipset`, `formFactor`, `memoryType`, `memorySlots`, `maxMemoryGb`, `maxMemorySpeedMhz?`, `m2Slots`, `sataPorts`, `wifi`

### Ram (`ram_kits`)

`memoryType`, `speedMhz`, `capacityGb`, `modules`, `voltage?`

### StorageDrive (`storage_drives`)

`interface` (StorageInterface), `capacityGb`, `formFactor`, `readMbps?`, `writeMbps?`

### Psu (`psus`)

`wattage`, `formFactor`, `efficiency`, `modular`, `lengthMm?`

### PcCase (`pc_cases`)

`supportedFormFactors` (String[]), `maxGpuLengthMm`, `maxCoolerHeightMm`, `psuFormFactor`, `maxRadiatorMm?`, `includedFans`

### Cooler (`coolers`)

`coolerType`, `supportedSockets` (String[]), `heightMm?`, `radiatorMm?`, `tdpRatingWatts?`

---

## Builder & compatibility

### CompatibilityRule (`compatibility_rules`)

| Field | Type | Notes |
|-------|------|-------|
| code | String | unique rule key |
| name, description | String | |
| severity | CompatibilitySeverity | |
| enabled | Boolean | |
| config | Json? | admin metadata only — **engine logic lives in server code** |

### PCBuild (`pc_builds`)

`userId?`, `name`, `slug?`, `notes?`, `visibility`, `totalPriceSnapshot?` (display only), `currency`

### PCBuildItem (`pc_build_items`)

`buildId`, `productId`, `variantId?`, `slot` (ComponentSlot), `quantity`  
Unique: `[buildId, slot, productId]`

---

## Performance

### Game (`games`)

`name`, `slug`, `coverUrl?`

### Benchmark (`benchmarks`)

`gameId`, `cpuProductId`, `gpuProductId`, `resolution`, `quality`, `avgFps`, `source?`  
Unique: `[gameId, cpuProductId, gpuProductId, resolution, quality]`

---

## Commerce

### Cart / CartItem

- Cart: `userId?` (unique) or `sessionId?` (unique), `couponCode?`, `lastActivityAt`
- CartItem: `cartId`, `variantId`, `quantity` — unique `[cartId, variantId]`

### Wishlist / WishlistItem

- Wishlist: one per user  
- WishlistItem: `wishlistId`, `variantId`

### Coupon / CouponUsage

- Coupon: `code`, `type`, `value`, `minSubtotal?`, `maxDiscount?`, `maxUses?`, `maxUsesPerUser?`, `startsAt?`, `endsAt?`, `isActive`
- CouponUsage: `couponId`, `userId`, `orderId?` (unique)

### Bundle / BundleItem

- Bundle: `name`, `slug`, `status`, `bundlePrice?` (optional fixed; else server sums variants)
- BundleItem: `bundleId`, `productId`, `variantId`, `quantity`

### Order / OrderItem

Order money fields: `subtotal`, `discountTotal`, `shippingTotal`, `taxTotal`, `grandTotal`  
Shipping **snapshot** columns: `shipName`, `shipLine1`, … `shipCountry`, `shipPhone`  
`orderNumber` unique; `status` OrderStatus; `paidAt?`

OrderItem: `variantId`, `productName`, `sku`, `unitPrice`, `quantity`, `lineTotal` (line snapshot)

### Payment / Refund

Payment: `provider` STRIPE, `status`, `amount`, `stripeSessionId?`, `stripePaymentIntentId?`, `rawEventId?`  
Refund: `paymentId`, `amount`, `status`, `reason?`, `stripeRefundId?`

**Webhook is source of truth for paid** (Phase 11).

---

## Reviews

### Review (`reviews`)

`productId`, `userId`, `rating`, `title?`, `body?`, `status` — unique `[productId, userId]`

### ReviewImage (`review_images`)

`reviewId`, `url`, `alt?`

---

## Inventory

### Inventory (`inventory`)

1:1 with variant: `quantityOnHand`, `quantityReserved`, `lowStockThreshold`

Checkout **reserves** (`quantityReserved += qty`, on-hand unchanged) when a PaymentIntent is created. Webhook `PAID` **commits** a `SALE` (`onHand` and `reserved` both decrease). Cancel / failed PI **releases** reserved units. Transactions are idempotent per `(orderId, inventoryId, type)`.

### InventoryTransaction (`inventory_transactions`)

`inventoryId`, `type`, `quantityDelta`, `reason?`, `orderId?`, `actorUserId?`

---

## Marketing

### AbandonedCart (`abandoned_carts`)

`cartId`, `userId?`, `email?`, `status`, `lastActivityAt`, `recoveredAt?`

Phase 14: cron upserts rows for **signed-in** carts (user email required). Status: `ACTIVE` → `EMAIL_SENT` → `CLICKED` → `RECOVERED` (paid webhook) or `EXPIRED` (7d idle or empty cart). Scheduler rules live in `@vorqen/types` (`decideAbandonedCartAction`).

### AbandonedCartEmail (`abandoned_cart_emails`)

`abandonedCartId`, `templateKey` (`abandoned_cart_1` / `abandoned_cart_2`), `sentAt`, `clickedAt?`, `recoveredAt?`

Click tracker: `GET /api/email/abandoned/[id]` sets `clickedAt` and 302s to `/cart`. Max two emails; reminder after 24h.

---

## System

### Notification (`notifications`)

`userId`, `channel`, `type`, `title`, `body?`, `readAt?`, `metadata?`

### AuditLog (`audit_logs`)

`actorUserId?`, `action`, `entityType`, `entityId?`, `metadata?`, `ip?`

Indexes: `(entityType, entityId)`, `actorUserId`, `createdAt`, `action`.

Admin mutations write rows for catalog, order status, refunds, inventory adjust, coupons, bundles, reviews, and customer activate/deactivate. Metadata is sanitized (password/token/secret keys redacted) before insert. Staff query `adminAuditLogs` / `/admin/audit`.

---

## Seed data (`pnpm db:seed`)

| Item | Detail |
|------|--------|
| Users | `admin@vorqen.local` (ADMIN), `builder@vorqen.local` (CUSTOMER) — password `Password123!` |
| Catalog | Brands, categories, CPU/GPU/MB/RAM/Storage/PSU/Case/Cooler SKUs + inventory |
| Compatible build | AM5 + DDR5 + 4080 SUPER + Meshify 2 + 850W (`am5-1440p-compatible`) |
| Incompatible builds | DDR4/ITX/undersized PSU stress build; Intel CPU on AM5 board |
| Rules | Seeded CompatibilityRule codes for Phase 6 engine |
| Coupon | `BUILD10` (10% off) |
| Benchmark | Cyberpunk 2077 @ 1440p ULTRA sample FPS |

---

## Model checklist

**Identity:** User, Address  
**Catalog:** Product, ProductVariant, ProductImage, Product3DAsset, Category, Brand  
**Hardware:** Cpu, Gpu, Motherboard, Ram, StorageDrive, Psu, PcCase, Cooler  
**Builder:** CompatibilityRule, PCBuild, PCBuildItem  
**Performance:** Game, Benchmark  
**Commerce:** Cart, CartItem, Wishlist, WishlistItem, Order, OrderItem, Payment, Refund, Coupon, CouponUsage, Bundle, BundleItem  
**Reviews:** Review, ReviewImage  
**Inventory:** Inventory, InventoryTransaction  
**Marketing:** AbandonedCart, AbandonedCartEmail  
**System:** Notification, AuditLog  

> Note: roles are the `UserRole` enum on `User` (no separate Role table).

## Status

| Item | State |
|------|-------|
| Full Prisma schema | ✅ Done (Phase 2) |
| Migrations path | `prisma/migrations` |
| Seed | `prisma/seed.ts` |
| Field docs | ✅ This file |

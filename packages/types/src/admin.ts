import { z } from 'zod';
import {
  COOLER_TYPES,
  PRODUCT_STATUSES,
  PRODUCT_TYPES,
  STORAGE_INTERFACES,
  cuidSchema,
  paginationInputSchema,
  slugSchema,
} from './catalog';
import { ORDER_STATUSES, type OrderStatus } from './checkout';
import { COUPON_TYPES } from './coupon';
import { REVIEW_STATUSES } from './reviews';

export const moneyStringSchema = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Use a decimal amount such as 199.99.');

export const adminProductListInputSchema = paginationInputSchema
  .extend({
    query: z.string().trim().min(1).max(100).optional(),
    type: z.enum(PRODUCT_TYPES).optional(),
    status: z.enum(PRODUCT_STATUSES).optional(),
    pageSize: z.number().int().min(1).max(48).default(20),
  })
  .strict();

export const upsertAdminBrandInputSchema = z
  .object({
    id: cuidSchema.optional(),
    name: z.string().trim().min(1).max(80),
    slug: slugSchema,
    logoUrl: z.string().trim().url().max(500).optional().nullable(),
    websiteUrl: z.string().trim().url().max(500).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
  })
  .strict();

export const upsertAdminCategoryInputSchema = z
  .object({
    id: cuidSchema.optional(),
    name: z.string().trim().min(1).max(80),
    slug: slugSchema,
    description: z.string().trim().max(2000).optional().nullable(),
    parentId: cuidSchema.optional().nullable(),
    sortOrder: z.number().int().min(0).max(10_000).default(0),
  })
  .strict();

export const adminCpuInputSchema = z
  .object({
    socket: z.string().trim().min(1).max(40),
    cores: z.number().int().min(1).max(256),
    threads: z.number().int().min(1).max(512),
    baseClockGhz: z.number().positive().max(20),
    boostClockGhz: z.number().positive().max(20),
    tdpWatts: z.number().int().min(1).max(2000),
    memoryType: z.string().trim().min(1).max(40),
    maxMemoryGhz: z.number().int().min(1).max(20_000).optional().nullable(),
    hasIntegratedGpu: z.boolean().default(false),
  })
  .strict();

export const adminGpuInputSchema = z
  .object({
    chipset: z.string().trim().min(1).max(80),
    lengthMm: z.number().int().min(1).max(1000),
    slotWidth: z.number().positive().max(8).default(2),
    tdpWatts: z.number().int().min(1).max(2000),
    recommendedPsuWatts: z.number().int().min(1).max(3000).optional().nullable(),
    vramGb: z.number().int().min(1).max(128),
    powerConnectors: z.string().trim().min(1).max(80),
    interfaceBus: z.string().trim().min(1).max(80).default('PCIe 4.0 x16'),
  })
  .strict();

export const adminMotherboardInputSchema = z
  .object({
    socket: z.string().trim().min(1).max(40),
    chipset: z.string().trim().min(1).max(40),
    formFactor: z.string().trim().min(1).max(40),
    memoryType: z.string().trim().min(1).max(40),
    memorySlots: z.number().int().min(1).max(16),
    maxMemoryGb: z.number().int().min(1).max(2048),
    maxMemorySpeedMhz: z.number().int().min(1).max(20_000).optional().nullable(),
    m2Slots: z.number().int().min(0).max(16).default(0),
    sataPorts: z.number().int().min(0).max(16).default(0),
    wifi: z.boolean().default(false),
  })
  .strict();

export const adminRamInputSchema = z
  .object({
    memoryType: z.string().trim().min(1).max(40),
    speedMhz: z.number().int().min(1).max(20_000),
    capacityGb: z.number().int().min(1).max(1024),
    modules: z.number().int().min(1).max(16).default(2),
    voltage: z.number().positive().max(5).optional().nullable(),
  })
  .strict();

export const adminStorageInputSchema = z
  .object({
    interface: z.enum(STORAGE_INTERFACES),
    capacityGb: z.number().int().min(1).max(100_000),
    formFactor: z.string().trim().min(1).max(40),
    readMbps: z.number().int().min(1).max(100_000).optional().nullable(),
    writeMbps: z.number().int().min(1).max(100_000).optional().nullable(),
  })
  .strict();

export const adminPsuInputSchema = z
  .object({
    wattage: z.number().int().min(1).max(5000),
    formFactor: z.string().trim().min(1).max(40),
    efficiency: z.string().trim().min(1).max(40),
    modular: z.string().trim().min(1).max(40),
    lengthMm: z.number().int().min(1).max(1000).optional().nullable(),
  })
  .strict();

export const adminCaseInputSchema = z
  .object({
    supportedFormFactors: z.array(z.string().trim().min(1).max(40)).min(1).max(12),
    maxGpuLengthMm: z.number().int().min(1).max(1000),
    maxCoolerHeightMm: z.number().int().min(1).max(500),
    psuFormFactor: z.string().trim().min(1).max(40),
    maxRadiatorMm: z.number().int().min(1).max(1000).optional().nullable(),
    includedFans: z.number().int().min(0).max(20).default(0),
  })
  .strict();

export const adminCoolerInputSchema = z
  .object({
    coolerType: z.enum(COOLER_TYPES),
    supportedSockets: z.array(z.string().trim().min(1).max(40)).min(1).max(24),
    heightMm: z.number().int().min(1).max(500).optional().nullable(),
    radiatorMm: z.number().int().min(1).max(1000).optional().nullable(),
    tdpRatingWatts: z.number().int().min(1).max(2000).optional().nullable(),
  })
  .strict();

export const upsertAdminProductInputSchema = z
  .object({
    id: cuidSchema.optional(),
    brandId: cuidSchema,
    categoryId: cuidSchema,
    type: z.enum(PRODUCT_TYPES),
    name: z.string().trim().min(1).max(160),
    slug: slugSchema,
    description: z.string().trim().max(8000).optional().nullable(),
    status: z.enum(PRODUCT_STATUSES).default('DRAFT'),
    isFeatured: z.boolean().default(false),
    cpu: adminCpuInputSchema.optional(),
    gpu: adminGpuInputSchema.optional(),
    motherboard: adminMotherboardInputSchema.optional(),
    ram: adminRamInputSchema.optional(),
    storage: adminStorageInputSchema.optional(),
    psu: adminPsuInputSchema.optional(),
    pcCase: adminCaseInputSchema.optional(),
    cooler: adminCoolerInputSchema.optional(),
  })
  .strict();

export const upsertAdminVariantInputSchema = z
  .object({
    id: cuidSchema.optional(),
    productId: cuidSchema,
    sku: z
      .string()
      .trim()
      .min(1)
      .max(64)
      .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, 'Invalid SKU.'),
    name: z.string().trim().min(1).max(120).optional().nullable(),
    price: moneyStringSchema,
    compareAtPrice: moneyStringSchema.optional().nullable(),
    currency: z.string().trim().length(3).toUpperCase().default('USD'),
    isDefault: z.boolean().default(false),
    isActive: z.boolean().default(true),
    weightGrams: z.number().int().min(0).max(100_000).optional().nullable(),
    quantityOnHand: z.number().int().min(0).max(1_000_000).optional(),
    lowStockThreshold: z.number().int().min(0).max(10_000).optional(),
  })
  .strict();

export const adminOrderListInputSchema = paginationInputSchema
  .extend({
    query: z.string().trim().min(1).max(80).optional(),
    status: z.enum(ORDER_STATUSES).optional(),
    pageSize: z.number().int().min(1).max(48).default(20),
  })
  .strict();

export const updateAdminOrderStatusInputSchema = z
  .object({
    id: cuidSchema,
    status: z.enum(ORDER_STATUSES),
  })
  .strict();

export const refundAdminOrderInputSchema = z
  .object({
    orderId: cuidSchema,
    amount: moneyStringSchema,
    reason: z.string().trim().min(1).max(200).optional().nullable(),
    restock: z.boolean().default(false),
  })
  .strict();

export const adminCustomerListInputSchema = paginationInputSchema
  .extend({
    query: z.string().trim().min(1).max(80).optional(),
    isActive: z.boolean().optional(),
    pageSize: z.number().int().min(1).max(48).default(20),
  })
  .strict();

export const setCustomerActiveInputSchema = z
  .object({
    userId: cuidSchema,
    isActive: z.boolean(),
  })
  .strict();

export const adminInventoryListInputSchema = paginationInputSchema
  .extend({
    query: z.string().trim().min(1).max(80).optional(),
    lowStockOnly: z.boolean().default(false),
    pageSize: z.number().int().min(1).max(48).default(20),
  })
  .strict();

export const adjustInventoryInputSchema = z
  .object({
    variantId: cuidSchema,
    quantityDelta: z.number().int().min(-100_000).max(100_000),
    reason: z.string().trim().min(1).max(200),
    lowStockThreshold: z.number().int().min(0).max(10_000).optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.quantityDelta === 0 && value.lowStockThreshold === undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['quantityDelta'],
        message: 'Provide a stock delta or a new low-stock threshold.',
      });
    }
  });

export const upsertAdminCouponInputSchema = z
  .object({
    id: cuidSchema.optional(),
    code: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, 'Invalid coupon code.')
      .transform((value) => value.toUpperCase()),
    type: z.enum(COUPON_TYPES),
    value: z.number().positive().max(1_000_000),
    minSubtotal: z.number().nonnegative().max(1_000_000).optional().nullable(),
    maxDiscount: z.number().positive().max(1_000_000).optional().nullable(),
    maxUses: z.number().int().min(1).max(1_000_000).optional().nullable(),
    maxUsesPerUser: z.number().int().min(1).max(100).optional().nullable(),
    startsAt: z.string().trim().min(10).max(40).optional().nullable(),
    endsAt: z.string().trim().min(10).max(40).optional().nullable(),
    isActive: z.boolean().default(true),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type === 'PERCENTAGE' && value.value > 100) {
      ctx.addIssue({
        code: 'custom',
        path: ['value'],
        message: 'Percentage coupons cannot exceed 100.',
      });
    }
    if (value.startsAt && value.endsAt && value.startsAt >= value.endsAt) {
      ctx.addIssue({
        code: 'custom',
        path: ['endsAt'],
        message: 'End must be after start.',
      });
    }
  });

export const upsertAdminBundleInputSchema = z
  .object({
    id: cuidSchema.optional(),
    name: z.string().trim().min(1).max(120),
    slug: slugSchema,
    description: z.string().trim().max(4000).optional().nullable(),
    status: z.enum(PRODUCT_STATUSES).default('DRAFT'),
    bundlePrice: moneyStringSchema.optional().nullable(),
    items: z
      .array(
        z
          .object({
            variantId: cuidSchema,
            quantity: z.number().int().min(1).max(16),
          })
          .strict(),
      )
      .min(1)
      .max(24),
  })
  .strict();

export const adminReviewListInputSchema = paginationInputSchema
  .extend({
    status: z.enum(REVIEW_STATUSES).optional(),
    pageSize: z.number().int().min(1).max(48).default(20),
  })
  .strict();

export const moderateReviewInputSchema = z
  .object({
    id: cuidSchema,
    status: z.enum(['APPROVED', 'REJECTED']),
  })
  .strict();

/** Staff may move fulfillment forward; never mark paid from admin. */
export const ADMIN_ORDER_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> =
  {
    PENDING_PAYMENT: ['CANCELLED'],
    PAID: ['PROCESSING'],
    PROCESSING: ['SHIPPED'],
    SHIPPED: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
    REFUNDED: [],
    PARTIALLY_REFUNDED: ['PROCESSING', 'SHIPPED', 'DELIVERED'],
  };

export function canAdminTransitionOrder(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  return ADMIN_ORDER_TRANSITIONS[from].includes(to);
}

export function remainingRefundable(
  paymentAmount: number,
  refundedSucceeded: number,
): number {
  const remaining =
    Math.round((paymentAmount - refundedSucceeded) * 100) / 100;
  return Math.max(0, remaining);
}

export type AdminProductListInput = z.infer<typeof adminProductListInputSchema>;
export type UpsertAdminBrandInput = z.infer<typeof upsertAdminBrandInputSchema>;
export type UpsertAdminCategoryInput = z.infer<
  typeof upsertAdminCategoryInputSchema
>;
export type UpsertAdminProductInput = z.infer<typeof upsertAdminProductInputSchema>;
export type UpsertAdminVariantInput = z.infer<typeof upsertAdminVariantInputSchema>;
export type AdminOrderListInput = z.infer<typeof adminOrderListInputSchema>;
export type UpdateAdminOrderStatusInput = z.infer<
  typeof updateAdminOrderStatusInputSchema
>;
export type RefundAdminOrderInput = z.infer<typeof refundAdminOrderInputSchema>;
export type AdminCustomerListInput = z.infer<typeof adminCustomerListInputSchema>;
export type SetCustomerActiveInput = z.infer<typeof setCustomerActiveInputSchema>;
export type AdminInventoryListInput = z.infer<
  typeof adminInventoryListInputSchema
>;
export type AdjustInventoryInput = z.infer<typeof adjustInventoryInputSchema>;
export type UpsertAdminCouponInput = z.infer<typeof upsertAdminCouponInputSchema>;
export type UpsertAdminBundleInput = z.infer<typeof upsertAdminBundleInputSchema>;
export type AdminReviewListInput = z.infer<typeof adminReviewListInputSchema>;
export type ModerateReviewInput = z.infer<typeof moderateReviewInputSchema>;

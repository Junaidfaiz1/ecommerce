import {
  adjustInventoryInputSchema,
  adminAnalyticsInputSchema,
  adminCustomerListInputSchema,
  adminInventoryListInputSchema,
  adminOrderListInputSchema,
  adminProductListInputSchema,
  adminAuditLogListInputSchema,
  adminReviewListInputSchema,
  cuidSchema,
  moderateReviewInputSchema,
  refundAdminOrderInputSchema,
  setCustomerActiveInputSchema,
  updateAdminOrderStatusInputSchema,
  upsertAdminBrandInputSchema,
  upsertAdminBundleInputSchema,
  upsertAdminCategoryInputSchema,
  upsertAdminCouponInputSchema,
  upsertAdminProductInputSchema,
  upsertAdminVariantInputSchema,
} from '@vorqen/types';
import { z } from 'zod';

export const adminAnalyticsArgsSchema = z
  .object({ input: adminAnalyticsInputSchema.nullish() })
  .strict();

export const adminProductsArgsSchema = z
  .object({ input: adminProductListInputSchema.nullish() })
  .strict();

export const adminProductArgsSchema = z
  .object({ id: cuidSchema })
  .strict();

export const adminOrdersArgsSchema = z
  .object({ input: adminOrderListInputSchema.nullish() })
  .strict();

export const adminCustomersArgsSchema = z
  .object({ input: adminCustomerListInputSchema.nullish() })
  .strict();

export const adminInventoryArgsSchema = z
  .object({ input: adminInventoryListInputSchema.nullish() })
  .strict();

export const adminReviewsArgsSchema = z
  .object({ input: adminReviewListInputSchema.nullish() })
  .strict();

export const adminAuditLogsArgsSchema = z
  .object({ input: adminAuditLogListInputSchema.nullish() })
  .strict();

export const upsertAdminBrandArgsSchema = z
  .object({ input: upsertAdminBrandInputSchema })
  .strict();

export const upsertAdminCategoryArgsSchema = z
  .object({ input: upsertAdminCategoryInputSchema })
  .strict();

export const upsertAdminProductArgsSchema = z
  .object({ input: upsertAdminProductInputSchema })
  .strict();

export const upsertAdminVariantArgsSchema = z
  .object({ input: upsertAdminVariantInputSchema })
  .strict();

export const updateAdminOrderStatusArgsSchema = z
  .object({ input: updateAdminOrderStatusInputSchema })
  .strict();

export const refundAdminOrderArgsSchema = z
  .object({ input: refundAdminOrderInputSchema })
  .strict();

export const setCustomerActiveArgsSchema = z
  .object({ input: setCustomerActiveInputSchema })
  .strict();

export const adjustInventoryArgsSchema = z
  .object({ input: adjustInventoryInputSchema })
  .strict();

export const upsertAdminCouponArgsSchema = z
  .object({ input: upsertAdminCouponInputSchema })
  .strict();

export const upsertAdminBundleArgsSchema = z
  .object({ input: upsertAdminBundleInputSchema })
  .strict();

export const moderateReviewArgsSchema = z
  .object({ input: moderateReviewInputSchema })
  .strict();

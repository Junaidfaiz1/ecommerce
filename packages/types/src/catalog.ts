import { z } from 'zod';

export const PRODUCT_TYPES = [
  'CPU',
  'GPU',
  'MOTHERBOARD',
  'RAM',
  'STORAGE',
  'PSU',
  'CASE',
  'COOLER',
  'ACCESSORY',
  'OTHER',
] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const STORAGE_INTERFACES = [
  'NVME_M2',
  'SATA_SSD',
  'SATA_HDD',
  'OTHER',
] as const;
export type StorageInterface = (typeof STORAGE_INTERFACES)[number];

export const COOLER_TYPES = ['AIR', 'AIO_LIQUID', 'CUSTOM_LOOP'] as const;
export type CoolerType = (typeof COOLER_TYPES)[number];

export const PRODUCT_SORTS = [
  'NAME_ASC',
  'NAME_DESC',
  'PRICE_ASC',
  'PRICE_DESC',
  'NEWEST',
  'FEATURED',
] as const;
export type ProductSort = (typeof PRODUCT_SORTS)[number];

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Invalid slug.');

export const cuidSchema = z.string().trim().min(1).max(64);

export const productListFilterSchema = z
  .object({
    query: z.string().trim().min(1).max(100).optional(),
    type: z.enum(PRODUCT_TYPES).optional(),
    brandSlug: slugSchema.optional(),
    categorySlug: slugSchema.optional(),
    featured: z.boolean().optional(),
    minPrice: z.number().nonnegative().finite().optional(),
    maxPrice: z.number().nonnegative().finite().optional(),
    inStock: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.minPrice !== undefined &&
      value.maxPrice !== undefined &&
      value.minPrice > value.maxPrice
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['minPrice'],
        message: 'minPrice must be less than or equal to maxPrice.',
      });
    }
  });

export const productSortSchema = z.enum(PRODUCT_SORTS);

export const paginationInputSchema = z
  .object({
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.number().int().min(1).max(48).default(24),
  })
  .strict();

export const productListInputSchema = z
  .object({
    filter: productListFilterSchema.nullish(),
    sort: productSortSchema.default('FEATURED'),
    page: z.number().int().min(1).max(10_000).default(1),
    pageSize: z.number().int().min(1).max(48).default(24),
  })
  .strict()
  .transform((value) => ({
    filter: value.filter ?? undefined,
    sort: value.sort,
    page: value.page,
    pageSize: value.pageSize,
  }));

export type ProductListFilter = z.infer<typeof productListFilterSchema>;
export type ProductListInput = z.infer<typeof productListInputSchema>;
export type PaginationInput = z.infer<typeof paginationInputSchema>;

/** Local storefront photo until licensed SKUs are uploaded to R2. */
export const CATALOG_PLACEHOLDER_IMAGE = '/assets/catalog/product.jpg';

export function isUnusableCatalogImageUrl(
  url: string | null | undefined,
): boolean {
  const value = url?.trim() ?? '';
  if (!value) return true;
  return value.includes('placeholder.vorqen.local');
}

export function resolveCatalogImageUrl(
  url: string | null | undefined,
): string {
  if (isUnusableCatalogImageUrl(url)) return CATALOG_PLACEHOLDER_IMAGE;
  return url!.trim();
}

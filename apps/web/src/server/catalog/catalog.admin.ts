import type {
  AddAdminProductImageInput,
  AdminProductListInput,
  DeleteAdminProductImageInput,
  UpdateAdminProductImageInput,
  UpsertAdminBrandInput,
  UpsertAdminCategoryInput,
  UpsertAdminProductInput,
  UpsertAdminVariantInput,
} from '@vorqen/types';
import { MAX_ADMIN_PRODUCT_IMAGES } from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { paginationMeta } from './catalog.filters';
import {
  mapBrand,
  mapCategory,
  mapProduct,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type ProductWithRelations,
} from './catalog.mappers';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../common/errors';
import { writeAuditLog } from '../audit';
import { removeStoredProductImage } from '../storage/product-media';

const productInclude = {
  brand: true,
  category: true,
  images: true,
  variants: { include: { inventory: true } },
  cpu: true,
  gpu: true,
  motherboard: true,
  ram: true,
  storage: true,
  psu: true,
  pcCase: true,
  cooler: true,
} as const;

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'P2002'
  );
}

async function loadAdminProduct(
  prisma: PrismaClient | Prisma.TransactionClient,
  id: string,
): Promise<CatalogProduct> {
  const product = (await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  })) as ProductWithRelations | null;
  if (!product) {
    throw new NotFoundError('Product not found.');
  }
  return mapProduct(product, { includeInactiveVariants: true });
}

export async function listAdminProducts(
  prisma: PrismaClient,
  input: AdminProductListInput,
) {
  const where: Prisma.ProductWhereInput = {
    ...(input.status ? { status: input.status } : {}),
    ...(input.type ? { type: input.type } : {}),
    ...(input.query
      ? {
          OR: [
            { name: { contains: input.query, mode: 'insensitive' as const } },
            { slug: { contains: input.query, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };
  const totalCount = await prisma.product.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);
  const rows = (await prisma.product.findMany({
    where,
    include: productInclude,
    orderBy: { updatedAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
  })) as ProductWithRelations[];

  return {
    items: rows.map((row) =>
      mapProduct(row, { includeInactiveVariants: true }),
    ),
    pageInfo: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
    },
  };
}

export async function getAdminProduct(prisma: PrismaClient, id: string) {
  return loadAdminProduct(prisma, id);
}

async function syncHardware(
  tx: Prisma.TransactionClient,
  productId: string,
  input: UpsertAdminProductInput,
): Promise<void> {
  const type = input.type;
  if (type !== 'CPU') await tx.cpu.deleteMany({ where: { productId } });
  if (type !== 'GPU') await tx.gpu.deleteMany({ where: { productId } });
  if (type !== 'MOTHERBOARD') {
    await tx.motherboard.deleteMany({ where: { productId } });
  }
  if (type !== 'RAM') await tx.ram.deleteMany({ where: { productId } });
  if (type !== 'STORAGE') await tx.storageDrive.deleteMany({ where: { productId } });
  if (type !== 'PSU') await tx.psu.deleteMany({ where: { productId } });
  if (type !== 'CASE') await tx.pcCase.deleteMany({ where: { productId } });
  if (type !== 'COOLER') await tx.cooler.deleteMany({ where: { productId } });

  if (type === 'CPU' && input.cpu) {
    await tx.cpu.upsert({
      where: { productId },
      create: { productId, ...input.cpu },
      update: input.cpu,
    });
  }
  if (type === 'GPU' && input.gpu) {
    await tx.gpu.upsert({
      where: { productId },
      create: { productId, ...input.gpu },
      update: input.gpu,
    });
  }
  if (type === 'MOTHERBOARD' && input.motherboard) {
    await tx.motherboard.upsert({
      where: { productId },
      create: { productId, ...input.motherboard },
      update: input.motherboard,
    });
  }
  if (type === 'RAM' && input.ram) {
    await tx.ram.upsert({
      where: { productId },
      create: { productId, ...input.ram },
      update: input.ram,
    });
  }
  if (type === 'STORAGE' && input.storage) {
    await tx.storageDrive.upsert({
      where: { productId },
      create: { productId, ...input.storage },
      update: input.storage,
    });
  }
  if (type === 'PSU' && input.psu) {
    await tx.psu.upsert({
      where: { productId },
      create: { productId, ...input.psu },
      update: input.psu,
    });
  }
  if (type === 'CASE' && input.pcCase) {
    await tx.pcCase.upsert({
      where: { productId },
      create: { productId, ...input.pcCase },
      update: input.pcCase,
    });
  }
  if (type === 'COOLER' && input.cooler) {
    await tx.cooler.upsert({
      where: { productId },
      create: { productId, ...input.cooler },
      update: input.cooler,
    });
  }
}

export async function upsertAdminBrand(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminBrandInput,
  ip: string | null,
): Promise<CatalogBrand> {
  try {
    const row = input.id
      ? await prisma.brand.update({
          where: { id: input.id },
          data: {
            name: input.name,
            slug: input.slug,
            logoUrl: input.logoUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            description: input.description ?? null,
          },
        })
      : await prisma.brand.create({
          data: {
            name: input.name,
            slug: input.slug,
            logoUrl: input.logoUrl ?? null,
            websiteUrl: input.websiteUrl ?? null,
            description: input.description ?? null,
          },
        });
    await writeAuditLog(prisma, {
      actorUserId,
      action: input.id ? 'brand.update' : 'brand.create',
      entityType: 'Brand',
      entityId: row.id,
      ip,
    });
    return mapBrand(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Brand slug or name already exists.');
    }
    throw error;
  }
}

export async function upsertAdminCategory(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminCategoryInput,
  ip: string | null,
): Promise<CatalogCategory> {
  if (input.parentId === input.id && input.id) {
    throw new ValidationError('A category cannot be its own parent.');
  }
  try {
    const data = {
      name: input.name,
      slug: input.slug,
      description: input.description ?? null,
      parentId: input.parentId ?? null,
      sortOrder: input.sortOrder,
    };
    const row = input.id
      ? await prisma.category.update({ where: { id: input.id }, data })
      : await prisma.category.create({ data });
    await writeAuditLog(prisma, {
      actorUserId,
      action: input.id ? 'category.update' : 'category.create',
      entityType: 'Category',
      entityId: row.id,
      ip,
    });
    return mapCategory(row);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Category slug already exists.');
    }
    throw error;
  }
}

export async function upsertAdminProduct(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminProductInput,
  ip: string | null,
): Promise<CatalogProduct> {
  const brand = await prisma.brand.findUnique({ where: { id: input.brandId } });
  if (!brand) throw new NotFoundError('Brand not found.');
  const category = await prisma.category.findUnique({
    where: { id: input.categoryId },
  });
  if (!category) throw new NotFoundError('Category not found.');

  try {
    const id = await prisma.$transaction(async (tx) => {
      const data = {
        brandId: input.brandId,
        categoryId: input.categoryId,
        type: input.type,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        status: input.status,
        isFeatured: input.isFeatured,
      };
      const row = input.id
        ? await tx.product.update({ where: { id: input.id }, data })
        : await tx.product.create({ data });
      await syncHardware(tx, row.id, input);
      await writeAuditLog(tx, {
        actorUserId,
        action: input.id ? 'product.update' : 'product.create',
        entityType: 'Product',
        entityId: row.id,
        metadata: { type: input.type, status: input.status },
        ip,
      });
      return row.id;
    });
    return loadAdminProduct(prisma, id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('Product slug already exists.');
    }
    throw error;
  }
}

export async function upsertAdminVariant(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminVariantInput,
  ip: string | null,
): Promise<CatalogProduct> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
  });
  if (!product) throw new NotFoundError('Product not found.');

  try {
    await prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.productVariant.updateMany({
          where: { productId: input.productId },
          data: { isDefault: false },
        });
      }

      const data = {
        sku: input.sku,
        name: input.name ?? null,
        price: input.price,
        compareAtPrice: input.compareAtPrice ?? null,
        currency: input.currency,
        isDefault: input.isDefault,
        isActive: input.isActive,
        weightGrams: input.weightGrams ?? null,
      };

      const variant = input.id
        ? await tx.productVariant.update({
            where: { id: input.id },
            data,
          })
        : await tx.productVariant.create({
            data: { ...data, productId: input.productId },
          });

      await tx.inventory.upsert({
        where: { variantId: variant.id },
        create: {
          variantId: variant.id,
          quantityOnHand: input.quantityOnHand ?? 0,
          lowStockThreshold: input.lowStockThreshold ?? 5,
        },
        update: {
          ...(input.lowStockThreshold !== undefined
            ? { lowStockThreshold: input.lowStockThreshold }
            : {}),
        },
      });

      await writeAuditLog(tx, {
        actorUserId,
        action: input.id ? 'variant.update' : 'variant.create',
        entityType: 'ProductVariant',
        entityId: variant.id,
        metadata: { productId: input.productId, sku: input.sku },
        ip,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError('SKU already exists.');
    }
    throw error;
  }

  return loadAdminProduct(prisma, input.productId);
}

export async function addAdminProductImage(
  prisma: PrismaClient,
  actorUserId: string,
  input: AddAdminProductImageInput,
  ip: string | null,
): Promise<CatalogProduct> {
  const product = await prisma.product.findUnique({
    where: { id: input.productId },
    include: { images: true },
  });
  if (!product) throw new NotFoundError('Product not found.');
  if (product.images.length >= MAX_ADMIN_PRODUCT_IMAGES) {
    throw new ValidationError(
      `A product can have at most ${MAX_ADMIN_PRODUCT_IMAGES} images.`,
    );
  }

  const nextSort =
    input.sortOrder ??
    product.images.reduce((max, row) => Math.max(max, row.sortOrder), -1) + 1;
  const isPrimary = input.isPrimary || product.images.length === 0;

  await prisma.$transaction(async (tx) => {
    if (isPrimary) {
      await tx.productImage.updateMany({
        where: { productId: input.productId },
        data: { isPrimary: false },
      });
    }
    const row = await tx.productImage.create({
      data: {
        productId: input.productId,
        url: input.url,
        alt: input.alt ?? product.name,
        isPrimary,
        sortOrder: nextSort,
      },
    });
    await writeAuditLog(tx, {
      actorUserId,
      action: 'product.image.create',
      entityType: 'ProductImage',
      entityId: row.id,
      metadata: { productId: input.productId, isPrimary },
      ip,
    });
  });

  return loadAdminProduct(prisma, input.productId);
}

export async function updateAdminProductImage(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpdateAdminProductImageInput,
  ip: string | null,
): Promise<CatalogProduct> {
  const image = await prisma.productImage.findUnique({
    where: { id: input.id },
  });
  if (!image) throw new NotFoundError('Product image not found.');

  await prisma.$transaction(async (tx) => {
    if (input.isPrimary) {
      await tx.productImage.updateMany({
        where: { productId: image.productId },
        data: { isPrimary: false },
      });
    }
    await tx.productImage.update({
      where: { id: input.id },
      data: {
        ...(input.alt !== undefined ? { alt: input.alt } : {}),
        ...(input.isPrimary !== undefined ? { isPrimary: input.isPrimary } : {}),
        ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      },
    });
    const remainingPrimary = await tx.productImage.count({
      where: { productId: image.productId, isPrimary: true },
    });
    if (remainingPrimary === 0) {
      const first = await tx.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (first) {
        await tx.productImage.update({
          where: { id: first.id },
          data: { isPrimary: true },
        });
      }
    }
    await writeAuditLog(tx, {
      actorUserId,
      action: 'product.image.update',
      entityType: 'ProductImage',
      entityId: input.id,
      metadata: { productId: image.productId },
      ip,
    });
  });

  return loadAdminProduct(prisma, image.productId);
}

export async function deleteAdminProductImage(
  prisma: PrismaClient,
  actorUserId: string,
  input: DeleteAdminProductImageInput,
  ip: string | null,
): Promise<CatalogProduct> {
  const image = await prisma.productImage.findUnique({
    where: { id: input.id },
  });
  if (!image) throw new NotFoundError('Product image not found.');

  await prisma.$transaction(async (tx) => {
    await tx.productImage.delete({ where: { id: input.id } });
    if (image.isPrimary) {
      const next = await tx.productImage.findFirst({
        where: { productId: image.productId },
        orderBy: { sortOrder: 'asc' },
      });
      if (next) {
        await tx.productImage.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
    await writeAuditLog(tx, {
      actorUserId,
      action: 'product.image.delete',
      entityType: 'ProductImage',
      entityId: input.id,
      metadata: { productId: image.productId },
      ip,
    });
  });

  await removeStoredProductImage(image.url);
  return loadAdminProduct(prisma, image.productId);
}

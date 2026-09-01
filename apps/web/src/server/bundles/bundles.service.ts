import { formatMoney, type UpsertAdminBundleInput } from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../common/errors';
import { writeAuditLog } from '../audit';

export type AdminBundle = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  bundlePrice: string | null;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    productName: string;
    sku: string;
  }>;
};

const bundleInclude = {
  items: {
    include: {
      product: { select: { name: true } },
      variant: { select: { sku: true } },
    },
  },
} as const;

function mapBundle(row: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  bundlePrice: { toString(): string } | null;
  createdAt: Date;
  updatedAt: Date;
  items: Array<{
    id: string;
    productId: string;
    variantId: string;
    quantity: number;
    product: { name: string };
    variant: { sku: string };
  }>;
}): AdminBundle {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    status: row.status,
    bundlePrice: row.bundlePrice
      ? formatMoney(Number(row.bundlePrice.toString()))
      : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.product.name,
      sku: item.variant.sku,
    })),
  };
}

export async function listAdminBundles(prisma: PrismaClient) {
  const rows = await prisma.bundle.findMany({
    include: bundleInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(mapBundle);
}

export async function upsertAdminBundle(
  prisma: PrismaClient,
  actorUserId: string,
  input: UpsertAdminBundleInput,
  ip: string | null,
): Promise<AdminBundle> {
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: input.items.map((i) => i.variantId) } },
    select: { id: true, productId: true, isActive: true },
  });
  if (variants.length !== input.items.length) {
    throw new ValidationError('One or more bundle variants were not found.');
  }

  const variantMap = new Map(variants.map((v) => [v.id, v]));

  try {
    const id = await prisma.$transaction(async (tx) => {
      const data = {
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        status: input.status,
        bundlePrice: input.bundlePrice ?? null,
      };
      const bundle = input.id
        ? await tx.bundle.update({ where: { id: input.id }, data })
        : await tx.bundle.create({ data });

      await tx.bundleItem.deleteMany({ where: { bundleId: bundle.id } });
      await tx.bundleItem.createMany({
        data: input.items.map((item) => {
          const variant = variantMap.get(item.variantId)!;
          return {
            bundleId: bundle.id,
            productId: variant.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          };
        }),
      });

      await writeAuditLog(tx, {
        actorUserId,
        action: input.id ? 'bundle.update' : 'bundle.create',
        entityType: 'Bundle',
        entityId: bundle.id,
        ip,
      });
      return bundle.id;
    });

    const row = await prisma.bundle.findUniqueOrThrow({
      where: { id },
      include: bundleInclude,
    });
    return mapBundle(row);
  } catch (error) {
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      throw new ConflictError('Bundle slug already exists.');
    }
    if (
      typeof error === 'object' &&
      error &&
      'code' in error &&
      (error as { code: string }).code === 'P2025'
    ) {
      throw new NotFoundError('Bundle not found.');
    }
    throw error;
  }
}

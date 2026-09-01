import type {
  BuildComponentInput,
  BuildVisibility,
  PreviewBuildInput,
  SaveBuildInput,
} from '@vorqen/types';
import { toCompatibilityComponents } from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../common/errors';
import { checkCompatibility } from '../compatibility/compatibility.service';
import { priceBuildComponents, type BuildPriceResult } from './pricing';

const buildInclude = {
  items: {
    include: {
      product: {
        include: {
          brand: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
      variant: true,
    },
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.PCBuildInclude;

type BuildRow = Prisma.PCBuildGetPayload<{ include: typeof buildInclude }>;

export type MappedBuildItem = {
  id: string;
  slot: BuildComponentInput['slot'];
  productId: string;
  variantId: string | null;
  quantity: number;
  productName: string;
  productSlug: string;
  brandName: string;
  imageUrl: string | null;
  unitPrice: string | null;
};

export type MappedBuild = {
  id: string;
  name: string;
  slug: string | null;
  notes: string | null;
  visibility: BuildVisibility;
  totalPriceSnapshot: string | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  userId: string | null;
  items: MappedBuildItem[];
};

export type BuildPreview = BuildPriceResult & {
  compatibility: Awaited<ReturnType<typeof checkCompatibility>>;
};

function decimalToString(value: { toFixed: (d?: number) => string } | null): string | null {
  if (!value) return null;
  return value.toFixed(2);
}

function mapBuild(row: BuildRow): MappedBuild {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    notes: row.notes,
    visibility: row.visibility,
    totalPriceSnapshot: decimalToString(row.totalPriceSnapshot),
    currency: row.currency,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    userId: row.userId,
    items: row.items.map((item) => ({
      id: item.id,
      slot: item.slot,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      productName: item.product.name,
      productSlug: item.product.slug,
      brandName: item.product.brand.name,
      imageUrl: item.product.images[0]?.url ?? null,
      unitPrice: item.variant ? item.variant.price.toFixed(2) : null,
    })),
  };
}

function assertCanView(build: BuildRow, userId: string | null): void {
  if (build.visibility === 'PUBLIC' || build.visibility === 'UNLISTED') {
    return;
  }
  if (build.userId && build.userId === userId) {
    return;
  }
  throw new ForbiddenError('This build is private.');
}

function assertOwner(build: { userId: string | null }, userId: string): void {
  if (build.userId !== userId) {
    throw new ForbiddenError('You do not own this build.');
  }
}

async function resolveVariants(
  prisma: PrismaClient,
  components: BuildComponentInput[],
): Promise<
  Array<BuildComponentInput & { variantId: string; unitPrice: string }>
> {
  const priced = await priceBuildComponents(prisma, components);
  const byKey = new Map(
    priced.lineItems.map((line) => [`${line.slot}:${line.productId}`, line]),
  );

  return components.map((c) => {
    const line = byKey.get(`${c.slot}:${c.productId}`);
    if (!line?.variantId) {
      throw new ValidationError(
        `No active default variant for product ${c.productId}.`,
        { productId: c.productId },
      );
    }
    return {
      ...c,
      variantId: c.variantId ?? line.variantId,
      unitPrice: line.unitPrice,
    };
  });
}

/**
 * Live server preview: DB prices + compatibility. Never trust client totals.
 */
export async function previewBuild(
  prisma: PrismaClient,
  input: PreviewBuildInput,
): Promise<BuildPreview> {
  const [pricing, compatibility] = await Promise.all([
    priceBuildComponents(prisma, input.components),
    checkCompatibility(prisma, {
      components: toCompatibilityComponents(input.components),
    }),
  ]);

  return {
    ...pricing,
    compatibility,
  };
}

export async function listMyBuilds(
  prisma: PrismaClient,
  userId: string,
): Promise<MappedBuild[]> {
  const rows = await prisma.pCBuild.findMany({
    where: { userId },
    include: buildInclude,
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
  return rows.map(mapBuild);
}

export async function getBuild(
  prisma: PrismaClient,
  args: { id?: string; slug?: string },
  userId: string | null,
): Promise<MappedBuild> {
  const row = args.id
    ? await prisma.pCBuild.findUnique({ where: { id: args.id }, include: buildInclude })
    : await prisma.pCBuild.findUnique({
        where: { slug: args.slug! },
        include: buildInclude,
      });

  if (!row) {
    throw new NotFoundError('Build not found.');
  }

  assertCanView(row, userId);
  return mapBuild(row);
}

export async function saveBuild(
  prisma: PrismaClient,
  userId: string,
  input: SaveBuildInput,
): Promise<MappedBuild> {
  const resolved = await resolveVariants(prisma, input.components);
  const pricing = await priceBuildComponents(prisma, input.components);

  // Re-run compatibility (authority); still allow save so users can iterate.
  await checkCompatibility(prisma, {
    components: toCompatibilityComponents(input.components),
  });

  if (input.slug) {
    const clash = await prisma.pCBuild.findUnique({ where: { slug: input.slug } });
    if (clash && clash.id !== input.id) {
      throw new ConflictError('That build slug is already taken.', {
        slug: 'Slug already in use.',
      });
    }
  }

  const itemsData = resolved.map((c) => ({
    slot: c.slot,
    productId: c.productId,
    variantId: c.variantId,
    quantity: c.quantity,
  }));

  if (input.id) {
    const existing = await prisma.pCBuild.findUnique({ where: { id: input.id } });
    if (!existing) {
      throw new NotFoundError('Build not found.');
    }
    assertOwner(existing, userId);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.pCBuildItem.deleteMany({ where: { buildId: input.id! } });
      return tx.pCBuild.update({
        where: { id: input.id! },
        data: {
          name: input.name,
          notes: input.notes ?? null,
          visibility: input.visibility,
          slug: input.visibility === 'PRIVATE' ? null : (input.slug ?? null),
          totalPriceSnapshot: pricing.totalPrice,
          currency: pricing.currency,
          items: { create: itemsData },
        },
        include: buildInclude,
      });
    });

    return mapBuild(updated);
  }

  const created = await prisma.pCBuild.create({
    data: {
      userId,
      name: input.name,
      notes: input.notes ?? null,
      visibility: input.visibility,
      slug: input.visibility === 'PRIVATE' ? null : (input.slug ?? null),
      totalPriceSnapshot: pricing.totalPrice,
      currency: pricing.currency,
      items: { create: itemsData },
    },
    include: buildInclude,
  });

  return mapBuild(created);
}

export async function duplicateBuild(
  prisma: PrismaClient,
  userId: string,
  id: string,
  name?: string,
): Promise<MappedBuild> {
  const source = await prisma.pCBuild.findUnique({
    where: { id },
    include: buildInclude,
  });
  if (!source) {
    throw new NotFoundError('Build not found.');
  }
  assertCanView(source, userId);

  const components: BuildComponentInput[] = source.items.map((item) => ({
    slot: item.slot,
    productId: item.productId,
    variantId: item.variantId ?? undefined,
    quantity: item.quantity,
  }));

  if (components.length === 0) {
    throw new ValidationError('Cannot duplicate an empty build.');
  }

  return saveBuild(prisma, userId, {
    name: name ?? `Copy of ${source.name}`.slice(0, 120),
    visibility: 'PRIVATE',
    components,
  });
}

export async function deleteBuild(
  prisma: PrismaClient,
  userId: string,
  id: string,
): Promise<{ ok: true }> {
  const existing = await prisma.pCBuild.findUnique({ where: { id } });
  if (!existing) {
    throw new NotFoundError('Build not found.');
  }
  assertOwner(existing, userId);
  await prisma.pCBuild.delete({ where: { id } });
  return { ok: true };
}

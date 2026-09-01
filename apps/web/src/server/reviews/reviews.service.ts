import type { CreateReviewInput, ProductReviewsInput } from '@vorqen/types';
import type { PrismaClient, Review, ReviewImage, User } from '@/generated/prisma/client';
import { ConflictError, NotFoundError, ValidationError } from '../common/errors';
import { paginationMeta } from '../catalog/catalog.filters';
import { writeAuditLog } from '../audit';

export type PublicReview = {
  id: string;
  productId: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: Review['status'];
  createdAt: string;
  authorName: string;
  images: Array<{ id: string; url: string; alt: string | null }>;
};

export type ReviewConnection = {
  items: PublicReview[];
  pageInfo: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  averageRating: number | null;
};

type ReviewRow = Review & {
  user: Pick<User, 'firstName' | 'lastName' | 'email'>;
  images: ReviewImage[];
};

function authorDisplayName(user: ReviewRow['user']): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim();
  if (name) return name;
  const local = user.email.split('@')[0] ?? 'Customer';
  return local.slice(0, 1).toUpperCase() + local.slice(1, 12);
}

function mapReview(row: ReviewRow): PublicReview {
  return {
    id: row.id,
    productId: row.productId,
    rating: row.rating,
    title: row.title,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    authorName: authorDisplayName(row.user),
    images: row.images.map((img) => ({
      id: img.id,
      url: img.url,
      alt: img.alt,
    })),
  };
}

async function resolveProductId(
  prisma: PrismaClient,
  input: ProductReviewsInput,
): Promise<string> {
  if (input.productId) {
    const product = await prisma.product.findFirst({
      where: { id: input.productId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundError('Product not found.', { productId: 'Unknown product.' });
    }
    return product.id;
  }

  if (input.productSlug) {
    const product = await prisma.product.findFirst({
      where: { slug: input.productSlug, status: 'ACTIVE' },
      select: { id: true },
    });
    if (!product) {
      throw new NotFoundError('Product not found.', {
        productSlug: 'Unknown product.',
      });
    }
    return product.id;
  }

  throw new ValidationError('Product id or slug is required.');
}

/**
 * Public list: APPROVED reviews only. Average is over approved ratings.
 */
export async function listProductReviews(
  prisma: PrismaClient,
  input: ProductReviewsInput,
): Promise<ReviewConnection> {
  const productId = await resolveProductId(prisma, input);
  const where = { productId, status: 'APPROVED' as const };
  const totalCount = await prisma.review.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);

  const avg = await prisma.review.aggregate({
    where,
    _avg: { rating: true },
  });

  const rows = (await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      images: true,
    },
  })) as ReviewRow[];

  return {
    items: rows.map(mapReview),
    pageInfo: {
      page: meta.page,
      pageSize: meta.pageSize,
      totalCount: meta.totalCount,
      totalPages: meta.totalPages,
      hasNextPage: meta.hasNextPage,
      hasPreviousPage: meta.hasPreviousPage,
    },
    averageRating: avg._avg.rating ?? null,
  };
}

/**
 * Authenticated create — status PENDING until staff moderation.
 */
export async function createReview(
  prisma: PrismaClient,
  userId: string,
  input: CreateReviewInput,
): Promise<PublicReview> {
  const product = await prisma.product.findFirst({
    where: { id: input.productId, status: 'ACTIVE' },
    select: { id: true },
  });
  if (!product) {
    throw new NotFoundError('Product not found.', { productId: 'Unknown product.' });
  }

  const existing = await prisma.review.findUnique({
    where: {
      productId_userId: { productId: input.productId, userId },
    },
  });
  if (existing) {
    throw new ConflictError('You already reviewed this product.', {
      productId: 'Review already exists.',
    });
  }

  const created = (await prisma.review.create({
    data: {
      productId: input.productId,
      userId,
      rating: input.rating,
      title: input.title ?? null,
      body: input.body ?? null,
      status: 'PENDING',
    },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      images: true,
    },
  })) as ReviewRow;

  return mapReview(created);
}

export type AdminReview = PublicReview & {
  userId: string;
  productName: string;
};

export async function listAdminReviews(
  prisma: PrismaClient,
  input: { page: number; pageSize: number; status?: Review['status'] },
): Promise<{
  items: AdminReview[];
  pageInfo: ReviewConnection['pageInfo'];
}> {
  const where = input.status ? { status: input.status } : {};
  const totalCount = await prisma.review.count({ where });
  const meta = paginationMeta(totalCount, input.page, input.pageSize);
  const rows = await prisma.review.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: meta.skip,
    take: meta.pageSize,
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      images: true,
      product: { select: { name: true } },
    },
  });

  return {
    items: rows.map((row) => ({
      ...mapReview(row as ReviewRow),
      userId: row.userId,
      productName: row.product.name,
    })),
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

export async function moderateReview(
  prisma: PrismaClient,
  actorUserId: string,
  input: { id: string; status: 'APPROVED' | 'REJECTED' },
  ip: string | null,
): Promise<AdminReview> {
  const existing = await prisma.review.findUnique({
    where: { id: input.id },
  });
  if (!existing) {
    throw new NotFoundError('Review not found.');
  }
  if (existing.status !== 'PENDING') {
    throw new ValidationError('Only pending reviews can be moderated.');
  }

  const row = await prisma.review.update({
    where: { id: input.id },
    data: { status: input.status },
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
      images: true,
      product: { select: { name: true } },
    },
  });
  await writeAuditLog(prisma, {
    actorUserId,
    action: `review.${input.status.toLowerCase()}`,
    entityType: 'Review',
    entityId: row.id,
    ip,
  });
  return {
    ...mapReview(row as ReviewRow),
    userId: row.userId,
    productName: row.product.name,
  };
}

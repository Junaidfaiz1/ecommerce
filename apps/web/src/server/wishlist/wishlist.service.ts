import type {
  AddWishlistItemInput,
  MoveWishlistItemToCartInput,
  RemoveWishlistItemInput,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { formatMoney } from '@vorqen/types';
import { NotFoundError, ValidationError } from '../common/errors';
import { addCartItem, type CartIdentity, type MappedCart } from '../cart';

const wishlistInclude = {
  items: {
    include: {
      variant: {
        include: {
          inventory: true,
          product: {
            include: {
              brand: true,
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' as const },
  },
} satisfies Prisma.WishlistInclude;

type WishlistRow = Prisma.WishlistGetPayload<{
  include: typeof wishlistInclude;
}>;

export type MappedWishlistItem = {
  id: string;
  variantId: string;
  createdAt: string;
  unitPrice: string;
  currency: string;
  availableQuantity: number;
  inStock: boolean;
  product: {
    id: string;
    name: string;
    slug: string;
    type: string;
    brandName: string;
    imageUrl: string | null;
  };
  variant: {
    id: string;
    sku: string;
    name: string | null;
  };
};

export type MappedWishlist = {
  id: string;
  items: MappedWishlistItem[];
  itemCount: number;
};

function availableQty(
  inventory: { quantityOnHand: number; quantityReserved: number } | null,
): number {
  if (!inventory) return 0;
  return Math.max(0, inventory.quantityOnHand - inventory.quantityReserved);
}

function mapWishlist(row: WishlistRow): MappedWishlist {
  const items: MappedWishlistItem[] = row.items.map((item) => {
    const variant = item.variant;
    const product = variant.product;
    const available = availableQty(variant.inventory);
    return {
      id: item.id,
      variantId: variant.id,
      createdAt: item.createdAt.toISOString(),
      unitPrice: formatMoney(Number(variant.price.toString())),
      currency: variant.currency,
      availableQuantity: available,
      inStock: available > 0,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        brandName: product.brand.name,
        imageUrl: product.images[0]?.url ?? null,
      },
      variant: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
      },
    };
  });

  return {
    id: row.id,
    items,
    itemCount: items.length,
  };
}

async function getOrCreateWishlist(
  prisma: PrismaClient,
  userId: string,
): Promise<WishlistRow> {
  const existing = await prisma.wishlist.findUnique({
    where: { userId },
    include: wishlistInclude,
  });
  if (existing) return existing;

  await prisma.wishlist.create({ data: { userId } });
  const created = await prisma.wishlist.findUnique({
    where: { userId },
    include: wishlistInclude,
  });
  if (!created) {
    throw new ValidationError('Could not create wishlist.');
  }
  return created;
}

export async function getWishlist(
  prisma: PrismaClient,
  userId: string,
): Promise<MappedWishlist> {
  const row = await getOrCreateWishlist(prisma, userId);
  return mapWishlist(row);
}

export async function addWishlistItem(
  prisma: PrismaClient,
  userId: string,
  input: AddWishlistItemInput,
): Promise<MappedWishlist> {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: input.variantId,
      isActive: true,
      product: { status: 'ACTIVE' },
    },
  });
  if (!variant) {
    throw new NotFoundError('Variant not found.', {
      variantId: input.variantId,
    });
  }

  const wishlist = await getOrCreateWishlist(prisma, userId);
  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_variantId: {
        wishlistId: wishlist.id,
        variantId: input.variantId,
      },
    },
  });

  if (!existing) {
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        variantId: input.variantId,
      },
    });
  }

  return getWishlist(prisma, userId);
}

export async function removeWishlistItem(
  prisma: PrismaClient,
  userId: string,
  input: RemoveWishlistItemInput,
): Promise<MappedWishlist> {
  const wishlist = await getOrCreateWishlist(prisma, userId);
  await prisma.wishlistItem.deleteMany({
    where: { wishlistId: wishlist.id, variantId: input.variantId },
  });
  return getWishlist(prisma, userId);
}

export async function moveWishlistItemToCart(
  prisma: PrismaClient,
  userId: string,
  identity: CartIdentity,
  input: MoveWishlistItemToCartInput,
): Promise<{ wishlist: MappedWishlist; cart: MappedCart }> {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    throw new NotFoundError('Wishlist item not found.', {
      variantId: input.variantId,
    });
  }

  const item = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_variantId: {
        wishlistId: wishlist.id,
        variantId: input.variantId,
      },
    },
  });
  if (!item) {
    throw new NotFoundError('Wishlist item not found.', {
      variantId: input.variantId,
    });
  }

  const cart = await addCartItem(prisma, identity, {
    variantId: input.variantId,
    quantity: input.quantity,
  });

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  const nextWishlist = await getWishlist(prisma, userId);
  return { wishlist: nextWishlist, cart };
}

export async function wishlistContains(
  prisma: PrismaClient,
  userId: string,
  variantId: string,
): Promise<boolean> {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return false;
  const item = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_variantId: {
        wishlistId: wishlist.id,
        variantId,
      },
    },
  });
  return Boolean(item);
}

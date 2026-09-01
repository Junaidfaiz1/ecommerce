import {
  CART_MAX_LINES,
  CART_MAX_LINE_QUANTITY,
  OPEN_ABANDONED_CART_STATUSES,
  formatMoney,
  type AddBuildToCartInput,
  type AddCartItemInput,
  type ApplyCouponInput,
  type RemoveCartItemInput,
  type UpdateCartItemInput,
} from '@vorqen/types';
import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import {
  clearCartSessionCookie,
  setCartSessionCookie,
} from '../auth/cookies';
import {
  InsufficientStockError,
  IncompatibleBuildError,
  NotFoundError,
  ValidationError,
} from '../common/errors';
import { checkCompatibility } from '../compatibility/compatibility.service';
import { catalogPhotoPath } from '../catalog/image-url';
import { softEvaluateCoupon, requireValidCoupon } from '../coupons';

const cartInclude = {
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
    orderBy: { createdAt: 'asc' as const },
  },
} satisfies Prisma.CartInclude;

type CartRow = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export type CartIdentity = {
  userId: string | null;
  sessionId: string | null;
};

export type MappedCartLine = {
  id: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
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

export type MappedCartTotals = {
  subtotal: string;
  discount: string;
  total: string;
  currency: string;
  itemCount: number;
  couponCode: string | null;
  couponValid: boolean;
  couponMessage: string | null;
};

export type MappedCart = {
  id: string;
  items: MappedCartLine[];
  totals: MappedCartTotals;
  lastActivityAt: string;
  updatedAt: string;
};

function availableQty(
  inventory: { quantityOnHand: number; quantityReserved: number } | null,
): number {
  if (!inventory) return 0;
  return Math.max(0, inventory.quantityOnHand - inventory.quantityReserved);
}

function mapCart(row: CartRow, couponEval: {
  discount: number;
  couponValid: boolean;
  couponMessage: string | null;
  couponCode: string | null;
}): MappedCart {
  const items: MappedCartLine[] = [];
  let subtotal = 0;
  let currency = 'USD';
  let itemCount = 0;

  for (const item of row.items) {
    const variant = item.variant;
    const product = variant.product;
    const unit = Number(variant.price.toString());
    const lineTotal = unit * item.quantity;
    const available = availableQty(variant.inventory);
    subtotal += lineTotal;
    currency = variant.currency;
    itemCount += item.quantity;

    items.push({
      id: item.id,
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice: formatMoney(unit),
      lineTotal: formatMoney(lineTotal),
      currency: variant.currency,
      availableQuantity: available,
      inStock: available > 0,
      product: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        type: product.type,
        brandName: product.brand.name,
        imageUrl: catalogPhotoPath(
          product.type,
          product.slug,
          product.images[0]?.url,
        ),
      },
      variant: {
        id: variant.id,
        sku: variant.sku,
        name: variant.name,
      },
    });
  }

  const discount = couponEval.discount;
  const total = Math.max(0, subtotal - discount);

  return {
    id: row.id,
    items,
    totals: {
      subtotal: formatMoney(subtotal),
      discount: formatMoney(discount),
      total: formatMoney(total),
      currency,
      itemCount,
      couponCode: couponEval.couponCode,
      couponValid: couponEval.couponValid,
      couponMessage: couponEval.couponMessage,
    },
    lastActivityAt: row.lastActivityAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function priceAndCoupon(
  prisma: PrismaClient,
  row: CartRow,
  userId: string | null,
): Promise<MappedCart> {
  let subtotal = 0;
  for (const item of row.items) {
    subtotal += Number(item.variant.price.toString()) * item.quantity;
  }

  let couponCode = row.couponCode;
  let discount = 0;
  let couponValid = false;
  let couponMessage: string | null = null;

  if (couponCode) {
    const result = await softEvaluateCoupon(
      prisma,
      couponCode,
      subtotal,
      userId,
    );
    if (result.ok) {
      discount = result.discount;
      couponValid = true;
      couponCode = result.code;
    } else {
      couponValid = false;
      couponMessage = result.reason;
      // Stale / invalid — clear stored code so checkout (Phase 11) stays clean.
      await prisma.cart.update({
        where: { id: row.id },
        data: { couponCode: null },
      });
      couponCode = null;
    }
  }

  return mapCart(row, {
    discount,
    couponValid,
    couponMessage,
    couponCode,
  });
}

async function touch(prisma: PrismaClient, cartId: string): Promise<void> {
  const now = new Date();
  await prisma.cart.update({
    where: { id: cartId },
    data: { lastActivityAt: now },
  });
  await prisma.abandonedCart.updateMany({
    where: {
      cartId,
      status: { in: [...OPEN_ABANDONED_CART_STATUSES] },
    },
    data: { lastActivityAt: now },
  });
}

async function loadCartRow(
  prisma: PrismaClient,
  cartId: string,
): Promise<CartRow> {
  const row = await prisma.cart.findUnique({
    where: { id: cartId },
    include: cartInclude,
  });
  if (!row) {
    throw new NotFoundError('Cart not found.');
  }
  return row;
}

/**
 * Resolve cart for user and/or guest session. Merges guest → user when both exist.
 * Creates a guest session cookie when neither identity has a cart yet and create is true.
 */
export async function resolveCartId(
  prisma: PrismaClient,
  identity: CartIdentity,
  opts: { create: boolean },
): Promise<{ cartId: string; sessionId: string | null } | null> {
  let sessionId = identity.sessionId;

  if (identity.userId) {
    let userCart = await prisma.cart.findUnique({
      where: { userId: identity.userId },
    });

    if (sessionId) {
      const guestCart = await prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });

      if (guestCart && guestCart.userId !== identity.userId) {
        if (!userCart) {
          userCart = await prisma.cart.update({
            where: { id: guestCart.id },
            data: { userId: identity.userId, sessionId: null },
          });
        } else if (guestCart.id !== userCart.id) {
          await mergeGuestItems(prisma, guestCart.id, userCart.id);
          await prisma.cart.delete({ where: { id: guestCart.id } });
        }
        await clearCartSessionCookie();
        sessionId = null;
      }
    }

    if (userCart) {
      return { cartId: userCart.id, sessionId };
    }

    if (!opts.create) return null;

    const created = await prisma.cart.create({
      data: { userId: identity.userId },
    });
    return { cartId: created.id, sessionId };
  }

  // Guest
  if (sessionId) {
    const existing = await prisma.cart.findUnique({ where: { sessionId } });
    if (existing) {
      return { cartId: existing.id, sessionId };
    }
  }

  if (!opts.create) return null;

  const newSessionId = sessionId ?? crypto.randomUUID();
  if (!sessionId) {
    await setCartSessionCookie(newSessionId);
  }

  const created = await prisma.cart.create({
    data: { sessionId: newSessionId },
  });
  return { cartId: created.id, sessionId: newSessionId };
}

async function mergeGuestItems(
  prisma: PrismaClient,
  guestCartId: string,
  userCartId: string,
): Promise<void> {
  const guestItems = await prisma.cartItem.findMany({
    where: { cartId: guestCartId },
  });
  const userItems = await prisma.cartItem.findMany({
    where: { cartId: userCartId },
  });
  const byVariant = new Map(userItems.map((i) => [i.variantId, i]));

  for (const item of guestItems) {
    const existing = byVariant.get(item.variantId);
    if (existing) {
      const next = Math.min(
        CART_MAX_LINE_QUANTITY,
        existing.quantity + item.quantity,
      );
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: next },
      });
    } else {
      const lineCount = byVariant.size;
      if (lineCount >= CART_MAX_LINES) continue;
      await prisma.cartItem.create({
        data: {
          cartId: userCartId,
          variantId: item.variantId,
          quantity: item.quantity,
        },
      });
      byVariant.set(item.variantId, item);
    }
  }

  if (guestItems.length > 0) {
    const guest = await prisma.cart.findUnique({ where: { id: guestCartId } });
    if (guest?.couponCode) {
      await prisma.cart.update({
        where: { id: userCartId },
        data: { couponCode: guest.couponCode },
      });
    }
  }
}

async function assertActiveVariant(
  prisma: PrismaClient,
  variantId: string,
  quantity: number,
) {
  const variant = await prisma.productVariant.findFirst({
    where: {
      id: variantId,
      isActive: true,
      product: { status: 'ACTIVE' },
    },
    include: { inventory: true },
  });

  if (!variant) {
    throw new NotFoundError('Variant not found.', { variantId });
  }

  const available = availableQty(variant.inventory);
  if (quantity > available) {
    throw new InsufficientStockError(
      available === 0
        ? 'This item is out of stock.'
        : `Only ${available} available.`,
      { variantId, available: String(available) },
    );
  }

  return variant;
}

export async function getCart(
  prisma: PrismaClient,
  identity: CartIdentity,
): Promise<MappedCart | null> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) return null;
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

export async function addCartItem(
  prisma: PrismaClient,
  identity: CartIdentity,
  input: AddCartItemInput,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: true });
  if (!resolved) {
    throw new ValidationError('Could not create cart.');
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: resolved.cartId,
        variantId: input.variantId,
      },
    },
  });

  const nextQty = (existing?.quantity ?? 0) + input.quantity;
  if (nextQty > CART_MAX_LINE_QUANTITY) {
    throw new ValidationError(
      `Quantity cannot exceed ${CART_MAX_LINE_QUANTITY}.`,
      { quantity: String(CART_MAX_LINE_QUANTITY) },
    );
  }

  await assertActiveVariant(prisma, input.variantId, nextQty);

  if (!existing) {
    const lineCount = await prisma.cartItem.count({
      where: { cartId: resolved.cartId },
    });
    if (lineCount >= CART_MAX_LINES) {
      throw new ValidationError(`Cart is limited to ${CART_MAX_LINES} lines.`);
    }
    await prisma.cartItem.create({
      data: {
        cartId: resolved.cartId,
        variantId: input.variantId,
        quantity: input.quantity,
      },
    });
  } else {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: nextQty },
    });
  }

  await touch(prisma, resolved.cartId);
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

export async function updateCartItem(
  prisma: PrismaClient,
  identity: CartIdentity,
  input: UpdateCartItemInput,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) {
    throw new NotFoundError('Cart not found.');
  }

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_variantId: {
        cartId: resolved.cartId,
        variantId: input.variantId,
      },
    },
  });
  if (!existing) {
    throw new NotFoundError('Cart item not found.', {
      variantId: input.variantId,
    });
  }

  await assertActiveVariant(prisma, input.variantId, input.quantity);
  await prisma.cartItem.update({
    where: { id: existing.id },
    data: { quantity: input.quantity },
  });
  await touch(prisma, resolved.cartId);
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

export async function removeCartItem(
  prisma: PrismaClient,
  identity: CartIdentity,
  input: RemoveCartItemInput,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) {
    throw new NotFoundError('Cart not found.');
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: resolved.cartId, variantId: input.variantId },
  });
  await touch(prisma, resolved.cartId);
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

export async function clearCart(
  prisma: PrismaClient,
  identity: CartIdentity,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) {
    throw new NotFoundError('Cart not found.');
  }

  await prisma.cartItem.deleteMany({ where: { cartId: resolved.cartId } });
  await prisma.cart.update({
    where: { id: resolved.cartId },
    data: { couponCode: null, lastActivityAt: new Date() },
  });
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

export async function applyCoupon(
  prisma: PrismaClient,
  identity: CartIdentity,
  input: ApplyCouponInput,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) {
    throw new NotFoundError('Cart is empty.');
  }

  const row = await loadCartRow(prisma, resolved.cartId);
  if (row.items.length === 0) {
    throw new ValidationError('Add items before applying a coupon.');
  }

  let subtotal = 0;
  for (const item of row.items) {
    subtotal += Number(item.variant.price.toString()) * item.quantity;
  }

  const valid = await requireValidCoupon(
    prisma,
    input.code,
    subtotal,
    identity.userId,
  );

  await prisma.cart.update({
    where: { id: resolved.cartId },
    data: { couponCode: valid.code, lastActivityAt: new Date() },
  });

  const refreshed = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, refreshed, identity.userId);
}

export async function removeCoupon(
  prisma: PrismaClient,
  identity: CartIdentity,
): Promise<MappedCart> {
  const resolved = await resolveCartId(prisma, identity, { create: false });
  if (!resolved) {
    throw new NotFoundError('Cart not found.');
  }

  await prisma.cart.update({
    where: { id: resolved.cartId },
    data: { couponCode: null, lastActivityAt: new Date() },
  });
  const row = await loadCartRow(prisma, resolved.cartId);
  return priceAndCoupon(prisma, row, identity.userId);
}

/**
 * Add every line from a saved build. Hard compatibility errors block the add.
 * Prices come from current variant rows — never from build snapshots.
 */
export async function addBuildToCart(
  prisma: PrismaClient,
  identity: CartIdentity,
  input: AddBuildToCartInput,
): Promise<MappedCart> {
  const build = await prisma.pCBuild.findUnique({
    where: { id: input.buildId },
    include: {
      items: {
        include: {
          product: true,
          variant: true,
        },
      },
    },
  });

  if (!build) {
    throw new NotFoundError('Build not found.', { buildId: input.buildId });
  }

  const canView =
    build.visibility === 'PUBLIC' ||
    build.visibility === 'UNLISTED' ||
    (identity.userId && build.userId === identity.userId);
  if (!canView) {
    throw new NotFoundError('Build not found.', { buildId: input.buildId });
  }

  if (build.items.length === 0) {
    throw new ValidationError('This build has no components.');
  }

  const compatibility = await checkCompatibility(prisma, {
    components: build.items.map((item) => ({
      slot: item.slot,
      productId: item.productId,
      quantity: item.quantity,
    })),
  });

  if (!compatibility.compatible) {
    throw new IncompatibleBuildError(
      compatibility.errors[0] ?? 'Build has compatibility errors.',
    );
  }

  let cart: MappedCart | null = null;
  for (const item of build.items) {
    let variantId = item.variantId;
    if (!variantId) {
      const product = await prisma.product.findFirst({
        where: { id: item.productId, status: 'ACTIVE' },
        include: {
          variants: {
            where: { isActive: true },
            orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
            take: 1,
          },
        },
      });
      variantId = product?.variants[0]?.id ?? null;
    }
    if (!variantId) {
      throw new ValidationError(
        `No active variant for ${item.product.name}.`,
        { productId: item.productId },
      );
    }

    cart = await addCartItem(prisma, identity, {
      variantId,
      quantity: item.quantity,
    });
  }

  if (!cart) {
    throw new ValidationError('Nothing was added to the cart.');
  }
  return cart;
}

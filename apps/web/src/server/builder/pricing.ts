import type { BuildComponentInput } from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { NotFoundError, ValidationError } from '../common/errors';

export type BuildLineItem = {
  slot: BuildComponentInput['slot'];
  productId: string;
  productName: string;
  variantId: string;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
};

export type BuildPriceResult = {
  totalPrice: string;
  currency: string;
  lineItems: BuildLineItem[];
};

function money(n: number): string {
  return n.toFixed(2);
}

/**
 * Server-authoritative build pricing from ACTIVE products + default/active variants.
 * Client must never supply unit prices.
 */
export async function priceBuildComponents(
  prisma: PrismaClient,
  components: BuildComponentInput[],
): Promise<BuildPriceResult> {
  if (components.length === 0) {
    throw new ValidationError('At least one component is required.');
  }

  const ids = [...new Set(components.map((c) => c.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: 'ACTIVE' },
    include: {
      variants: {
        where: { isActive: true },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      },
    },
  });

  if (products.length !== ids.length) {
    const found = new Set(products.map((p) => p.id));
    const missing = ids.find((id) => !found.has(id));
    throw new NotFoundError('Product not found.', {
      productId: missing ?? 'Unknown product.',
    });
  }

  const byId = new Map(products.map((p) => [p.id, p]));
  const lineItems: BuildLineItem[] = [];
  let total = 0;
  let currency = 'USD';

  for (const item of components) {
    const product = byId.get(item.productId)!;
    const variant = item.variantId
      ? product.variants.find((v) => v.id === item.variantId)
      : product.variants.find((v) => v.isDefault) ?? product.variants[0];

    if (!variant) {
      throw new ValidationError(
        `Product "${product.name}" has no active variant.`,
        { productId: product.id },
      );
    }

    if (item.variantId && variant.id !== item.variantId) {
      throw new NotFoundError('Variant not found for product.', {
        variantId: item.variantId,
      });
    }

    const unit = Number(variant.price.toString());
    const lineTotal = unit * item.quantity;
    total += lineTotal;
    currency = variant.currency;

    lineItems.push({
      slot: item.slot,
      productId: product.id,
      productName: product.name,
      variantId: variant.id,
      quantity: item.quantity,
      unitPrice: money(unit),
      lineTotal: money(lineTotal),
    });
  }

  return {
    totalPrice: money(total),
    currency,
    lineItems,
  };
}

/** Pure helper for unit tests — sum parsed line totals. */
export function sumLineTotals(lines: Array<{ lineTotal: string }>): string {
  const total = lines.reduce((acc, line) => acc + Number(line.lineTotal), 0);
  return money(total);
}

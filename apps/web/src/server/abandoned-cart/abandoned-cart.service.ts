import {
  ABANDONED_CART_EXPIRE_MS,
  ABANDONED_CART_IDLE_MS,
  OPEN_ABANDONED_CART_STATUSES,
  abandonedCartClickIdSchema,
  decideAbandonedCartAction,
} from '@vorqen/types';
import type { PrismaClient } from '@/generated/prisma/client';
import { logger } from '../common/logger';
import { getAppUrl, sendAbandonedCartEmail } from '../email';

const JOB_BATCH = 100;

export type AbandonedCartJobResult = {
  scanned: number;
  sent: number;
  expired: number;
  skipped: number;
};

export async function markAbandonedCartsRecovered(
  prisma: PrismaClient,
  cartId: string,
  now = new Date(),
): Promise<void> {
  await prisma.abandonedCart.updateMany({
    where: {
      cartId,
      status: { in: [...OPEN_ABANDONED_CART_STATUSES] },
    },
    data: { status: 'RECOVERED', recoveredAt: now },
  });
  await prisma.abandonedCartEmail.updateMany({
    where: {
      recoveredAt: null,
      abandonedCart: { cartId },
    },
    data: { recoveredAt: now },
  });
}

export async function recordAbandonedCartClick(
  prisma: PrismaClient,
  rawId: string,
): Promise<void> {
  const parsed = abandonedCartClickIdSchema.safeParse(rawId);
  if (!parsed.success) return;

  const row = await prisma.abandonedCartEmail.findUnique({
    where: { id: parsed.data },
    include: { abandonedCart: true },
  });
  if (!row) return;

  const now = new Date();
  await prisma.abandonedCartEmail.update({
    where: { id: row.id },
    data: { clickedAt: row.clickedAt ?? now },
  });

  if (row.abandonedCart.status === 'EMAIL_SENT') {
    await prisma.abandonedCart.update({
      where: { id: row.abandonedCartId },
      data: { status: 'CLICKED' },
    });
  }
}

async function expireStaleAbandonedCarts(
  prisma: PrismaClient,
  now: Date,
): Promise<number> {
  const expireBefore = new Date(now.getTime() - ABANDONED_CART_EXPIRE_MS);
  const byEmpty = await prisma.abandonedCart.updateMany({
    where: {
      status: { in: [...OPEN_ABANDONED_CART_STATUSES] },
      cart: { items: { none: {} } },
    },
    data: { status: 'EXPIRED' },
  });
  const byAge = await prisma.abandonedCart.updateMany({
    where: {
      status: { in: [...OPEN_ABANDONED_CART_STATUSES] },
      cart: { lastActivityAt: { lte: expireBefore } },
    },
    data: { status: 'EXPIRED' },
  });
  return byEmpty.count + byAge.count;
}

export type AbandonedCartSendFn = (
  to: string,
  input: {
    templateKey: 'abandoned_cart_1' | 'abandoned_cart_2';
    clickUrl: string;
    itemNames: string[];
  },
) => Promise<{ skipped: boolean }>;

export async function runAbandonedCartJob(
  prisma: PrismaClient,
  now = new Date(),
  send: AbandonedCartSendFn = sendAbandonedCartEmail,
): Promise<AbandonedCartJobResult> {
  const expired = await expireStaleAbandonedCarts(prisma, now);
  const idleBefore = new Date(now.getTime() - ABANDONED_CART_IDLE_MS);

  const carts = await prisma.cart.findMany({
    where: {
      userId: { not: null },
      lastActivityAt: { lte: idleBefore },
      items: { some: {} },
    },
    include: {
      items: {
        include: {
          variant: {
            include: { product: { select: { name: true } } },
          },
        },
      },
      user: { select: { id: true, email: true } },
      abandonedCarts: {
        where: { status: { in: [...OPEN_ABANDONED_CART_STATUSES] } },
        include: { emails: { orderBy: { sentAt: 'asc' } } },
        orderBy: { updatedAt: 'desc' },
        take: 1,
      },
    },
    take: JOB_BATCH,
  });

  const result: AbandonedCartJobResult = {
    scanned: carts.length,
    sent: 0,
    expired,
    skipped: 0,
  };

  for (const cart of carts) {
    const email = cart.user?.email ?? null;
    const open = cart.abandonedCarts[0] ?? null;
    const decision = decideAbandonedCartAction({
      now,
      itemCount: cart.items.length,
      email,
      lastActivityAt: cart.lastActivityAt,
      status: open?.status ?? 'ACTIVE',
      emails:
        open?.emails.map((row) => ({
          templateKey: row.templateKey,
          sentAt: row.sentAt,
        })) ?? [],
    });

    if (decision.action === 'skip') {
      result.skipped += 1;
      continue;
    }

    if (decision.action === 'expire') {
      if (open) {
        await prisma.abandonedCart.update({
          where: { id: open.id },
          data: { status: 'EXPIRED' },
        });
        result.expired += 1;
      } else {
        result.skipped += 1;
      }
      continue;
    }

    if (!email || !cart.userId) {
      result.skipped += 1;
      continue;
    }

    let emailRowId: string | null = null;
    try {
      const record =
        open ??
        (await prisma.abandonedCart.create({
          data: {
            cartId: cart.id,
            userId: cart.userId,
            email,
            status: 'ACTIVE',
            lastActivityAt: cart.lastActivityAt,
          },
        }));

      const emailRow = await prisma.abandonedCartEmail.create({
        data: {
          abandonedCartId: record.id,
          templateKey: decision.templateKey,
        },
      });
      emailRowId = emailRow.id;

      const clickUrl = `${getAppUrl()}/api/email/abandoned/${emailRow.id}`;
      const sendResult = await send(email, {
        templateKey: decision.templateKey,
        clickUrl,
        itemNames: cart.items.map((item) => item.variant.product.name),
      });

      if (sendResult.skipped) {
        await prisma.abandonedCartEmail.delete({ where: { id: emailRow.id } });
        result.skipped += 1;
        continue;
      }

      await prisma.abandonedCart.update({
        where: { id: record.id },
        data: {
          status: 'EMAIL_SENT',
          email,
          lastActivityAt: cart.lastActivityAt,
        },
      });
      result.sent += 1;
    } catch (error) {
      if (emailRowId) {
        try {
          await prisma.abandonedCartEmail.delete({ where: { id: emailRowId } });
        } catch (cleanupError) {
          logger.warn('abandoned_cart_email_cleanup_failed', {
            cartId: cart.id,
            message:
              cleanupError instanceof Error ? cleanupError.message : 'unknown',
          });
        }
      }
      logger.error('abandoned_cart_send_failed', {
        cartId: cart.id,
        message: error instanceof Error ? error.message : 'unknown',
      });
      result.skipped += 1;
    }
  }

  logger.info('abandoned_cart_job_complete', { ...result });
  return result;
}

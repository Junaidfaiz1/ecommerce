import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ABANDONED_CART_IDLE_MS } from '@vorqen/types';
import {
  markAbandonedCartsRecovered,
  recordAbandonedCartClick,
  runAbandonedCartJob,
} from './abandoned-cart.service';
import { addCartItem } from '../cart';
import { IDS, seedShop } from '../test/fixtures';
import { createMemoryPrisma } from '../test/memory-prisma';

const NOW = new Date('2026-09-01T12:00:00.000Z');
const identity = { userId: IDS.customer, sessionId: null };

describe('abandoned cart job (integration)', () => {
  it('sends the first recovery email for an idle signed-in cart', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });

    const idleAt = new Date(NOW.getTime() - ABANDONED_CART_IDLE_MS - 60_000);
    const cart = await prisma.cart.findUnique({ where: { userId: IDS.customer } });
    assert.ok(cart);
    await prisma.cart.update({
      where: { id: cart.id },
      data: { lastActivityAt: idleAt },
    });

    let sent = 0;
    const result = await runAbandonedCartJob(prisma, NOW, async () => {
      sent += 1;
      return { skipped: false };
    });

    assert.equal(result.sent, 1);
    assert.equal(sent, 1);

    const campaign = await prisma.abandonedCart.findFirst({
      where: { cartId: cart.id },
      include: { emails: true },
    });
    assert.equal(campaign?.status, 'EMAIL_SENT');
    assert.equal(campaign?.emails.length, 1);
    assert.equal(campaign?.emails[0]?.templateKey, 'abandoned_cart_1');
  });

  it('skips send when the mailer is unconfigured', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    const cart = await prisma.cart.findUnique({ where: { userId: IDS.customer } });
    assert.ok(cart);
    await prisma.cart.update({
      where: { id: cart.id },
      data: {
        lastActivityAt: new Date(NOW.getTime() - ABANDONED_CART_IDLE_MS - 1),
      },
    });

    const result = await runAbandonedCartJob(prisma, NOW, async () => ({
      skipped: true,
    }));
    assert.equal(result.sent, 0);
    assert.equal(result.skipped, 1);
    assert.equal(await prisma.abandonedCartEmail.count(), 0);
  });

  it('records a click and marks the campaign recovered on paid', async () => {
    const prisma = createMemoryPrisma();
    await seedShop(prisma);
    await addCartItem(prisma, identity, {
      variantId: IDS.gpuVar,
      quantity: 1,
    });
    const cart = await prisma.cart.findUnique({ where: { userId: IDS.customer } });
    assert.ok(cart);

    const campaign = await prisma.abandonedCart.create({
      data: {
        cartId: cart.id,
        userId: IDS.customer,
        email: 'builder@vorqen.local',
        status: 'EMAIL_SENT',
        lastActivityAt: NOW,
      },
    });
    const emailRow = await prisma.abandonedCartEmail.create({
      data: {
        id: 'cemailclick00000000000001',
        abandonedCartId: campaign.id,
        templateKey: 'abandoned_cart_1',
      },
    });

    await recordAbandonedCartClick(prisma, emailRow.id);
    const clicked = await prisma.abandonedCart.findUnique({
      where: { id: campaign.id },
    });
    assert.equal(clicked?.status, 'CLICKED');

    await markAbandonedCartsRecovered(prisma, cart.id, NOW);
    const recovered = await prisma.abandonedCart.findUnique({
      where: { id: campaign.id },
    });
    assert.equal(recovered?.status, 'RECOVERED');
  });
});
